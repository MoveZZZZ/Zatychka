using Microsoft.EntityFrameworkCore;
using Zatychka.Server.Data;
using Zatychka.Server.Models;

namespace Zatychka.Server.Services
{
    public class TransactionGenerationService
    {
        private readonly AppDbContext _db;
        private readonly Random _rnd = new Random();

        public TransactionGenerationService(AppDbContext db) => _db = db;




        static DateTime UtcToday() => DateTime.UtcNow.Date;
        static (DateTime from, DateTime to) UtcMonthRange(DateTime nowUtc)
        {
            var from = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var to = from.AddMonths(1);
            return (from, to);
        }
        public class BackfillMonthRequest
        {
            public int Year { get; set; }      // 2025
            public int Month { get; set; }     // 1..12
            public int? MaxTotalCount { get; set; } // опционально верхняя крышка (например 5000)

            public List<PairConfig> Pairs { get; set; } = new();

            public class PairConfig
            {
                public int DeviceId { get; set; }
                public int RequisiteId { get; set; }

                public decimal MinAmountUsdt { get; set; }
                public decimal MaxAmountUsdt { get; set; }

                public int DailyLimit { get; set; }    // макс кол-во в день
                public int MonthlyLimit { get; set; }  // макс кол-во в месяц
            }
        }

        public class BackfillMonthResult
        {
            public int Created { get; set; }
            public Dictionary<string, int> ByPair { get; set; } = new(); // "deviceId:requisiteId" -> count
        }

        static DateTime UtcMonthStart(int year, int month) =>
            new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);

        static DateTime UtcNextMonth(DateTime monthStartUtc) =>
            monthStartUtc.AddMonths(1);
        decimal RandomMoney(decimal min, decimal max)
        {
            if (max < min) max = min;
            var minInt = (int)Math.Round(min * 100m);
            var maxInt = (int)Math.Round(max * 100m);
            var val = _rnd.Next(minInt, maxInt + 1); // [min,max]
            return val / 100m;
        }

        string RandomStatus()
        {
            // 0.5% Заморожена, 1% Создана, 5% В процессе, остальное Выполнена
            var x = _rnd.NextDouble(); // [0,1)
            if (x < 0.005) return "Заморожена";
            if (x < 0.015) return "Создана";
            if (x < 0.065) return "В процессе";
            return "Выполнена";
        }

        public class GenerateRequest
        {
            public List<int> LinkIds { get; set; } = new();

            /// <summary>
            /// Сколько попытаться создать за запуск (верхняя «крышка»).
            /// В режиме FillDailyToLimit фактически создастся min(Count, сумма дневных остатков по выбранным связкам).
            /// </summary>
            public int Count { get; set; } = 100;

            /// <summary>
            /// Заполнять по каждой связке до дневного лимита (не превышая месячный/общий).
            /// </summary>
            public bool FillDailyToLimit { get; set; } = true;

            /// <summary>
            /// Игнорировать паузы и лимит конкурентности в пакетной генерации.
            /// </summary>
            public bool IgnoreTiming { get; set; } = true;
        }

        public class GenerateResult
        {
            public int Created { get; set; }
            public Dictionary<int, int> ByLink { get; set; } = new();
            public List<int> SkippedInactive { get; set; } = new();
        }

        private sealed class LinkCounters
        {
            public int RemainDaily;
            public int RemainMonthly;
            public int RemainTotal;

            public int Active;                   // для информации; при IgnoreTiming не ограничиваем
            public DateTime? LastDate;           // —//—
            public bool AnyCapacity => RemainDaily > 0 && RemainMonthly > 0 && RemainTotal > 0;
        }

        public async Task<GenerateResult> GenerateAsync(GenerateRequest req, CancellationToken ct = default)
        {
            var result = new GenerateResult();

            if (req.Count <= 0 || req.LinkIds.Count == 0)
                return result;

            // тянем выбранные связки
            var links = await _db.Links
                .Where(l => req.LinkIds.Contains(l.Id))
                .ToListAsync(ct);

            // исключим неактивные
            var activeLinks = links.Where(l => l.IsActive).ToList();
            result.SkippedInactive = links.Where(l => !l.IsActive).Select(l => l.Id).ToList();

            if (activeLinks.Count == 0) return result;

            var nowUtc = DateTime.UtcNow;
            var today = UtcToday();
            var (mFrom, mTo) = UtcMonthRange(nowUtc);

            // посчитаем остатки по лимитам на момент запуска
            var counters = new Dictionary<int, LinkCounters>();

            foreach (var l in activeLinks)
            {
                var totalCnt = await _db.PayinTransactionsPublic.CountAsync(x => x.LinkId == l.Id, ct);
                var dailyCnt = await _db.PayinTransactionsPublic.CountAsync(x => x.LinkId == l.Id && x.Date >= today && x.Date < today.AddDays(1), ct);
                var monthlyCnt = await _db.PayinTransactionsPublic.CountAsync(x => x.LinkId == l.Id && x.Date >= mFrom && x.Date < mTo, ct);
                var activeCnt = await _db.PayinTransactionsPublic.CountAsync(x => x.LinkId == l.Id && x.Status != "Выполнена", ct);
                var lastDate = await _db.PayinTransactionsPublic
                                            .Where(x => x.LinkId == l.Id)
                                            .OrderByDescending(x => x.Date)
                                            .Select(x => (DateTime?)x.Date)
                                            .FirstOrDefaultAsync(ct);

                int remainTotal = l.TotalTxCountLimit.HasValue ? (l.TotalTxCountLimit.Value - totalCnt) : int.MaxValue;
                int remainDaily = l.DailyTxCountLimit.HasValue ? (l.DailyTxCountLimit.Value - dailyCnt) : int.MaxValue;
                int remainMonthly = l.MonthlyTxCountLimit.HasValue ? (l.MonthlyTxCountLimit.Value - monthlyCnt) : int.MaxValue;

                counters[l.Id] = new LinkCounters
                {
                    RemainTotal = Math.Max(0, remainTotal),
                    RemainDaily = Math.Max(0, remainDaily),
                    RemainMonthly = Math.Max(0, remainMonthly),
                    Active = activeCnt,
                    LastDate = lastDate
                };
            }

            // целевое количество к созданию
            int totalCap = counters.Where(kv => kv.Value.AnyCapacity).Sum(kv =>
                Math.Min(kv.Value.RemainTotal, Math.Min(kv.Value.RemainDaily, kv.Value.RemainMonthly))
            );

            int target = req.FillDailyToLimit
                ? Math.Min(req.Count, totalCap)
                : req.Count;

            if (target <= 0) return result;

            var toInsert = new List<PayinTransactionPublic>();

            for (int i = 0; i < target; i++)
            {
                // набор связок, у которых ещё есть остаток по всем лимитам
                var candidateIds = counters.Where(kv => kv.Value.AnyCapacity)
                                           .Select(kv => kv.Key)
                                           .ToList();
                if (candidateIds.Count == 0) break;

                // случайная связка
                var linkId = candidateIds[_rnd.Next(candidateIds.Count)];
                var link = activeLinks.First(l => l.Id == linkId);
                var st = counters[linkId];

                // если не игнорируем тайминги — тут можно вернуть проверку конкурентности/паузы
                if (!req.IgnoreTiming)
                {
                    if (link.MaxConcurrentTransactions.HasValue && st.Active >= link.MaxConcurrentTransactions.Value)
                        continue;

                    if (link.MinMinutesBetweenTransactions.HasValue && st.LastDate.HasValue)
                    {
                        var mins = (nowUtc - st.LastDate.Value).TotalMinutes;
                        if (mins < link.MinMinutesBetweenTransactions.Value)
                            continue;
                    }
                }

                // суммы и статус
                var deal = RandomMoney(link.MinAmountUsdt, link.MaxAmountUsdt);
                var income = RandomMoney(link.MinAmountUsdt, Math.Min(link.MaxAmountUsdt, deal));
                var status = RandomStatus();

                toInsert.Add(new PayinTransactionPublic
                {
                    LinkId = link.Id,
                    DeviceId = link.DeviceId,
                    RequisiteId = link.RequisiteId,
                    Date = nowUtc,           // можно рандомизировать в рамках дня, если нужно
                    Status = status,
                    DealAmount = deal,
                    IncomeAmount = income
                });

                // обновим локальные остатки
                st.RemainTotal = Math.Max(0, st.RemainTotal - 1);
                st.RemainMonthly = Math.Max(0, st.RemainMonthly - 1);
                st.RemainDaily = Math.Max(0, st.RemainDaily - 1);
                if (status != "Выполнена") st.Active += 1;
                st.LastDate = nowUtc;
                counters[linkId] = st;

                if (!result.ByLink.ContainsKey(linkId)) result.ByLink[linkId] = 0;
                result.ByLink[linkId] += 1;
            }

            if (toInsert.Count > 0)
            {
                await _db.PayinTransactionsPublic.AddRangeAsync(toInsert, ct);
                await _db.SaveChangesAsync(ct);
            }

            result.Created = toInsert.Count;
            return result;
        }


        public async Task<BackfillMonthResult> BackfillMonthAsync(BackfillMonthRequest req, CancellationToken ct = default)
        {
            if (req.Year < 2000 || req.Month < 1 || req.Month > 12)
                throw new ArgumentException("Некорректный месяц/год");

            if (req.Pairs == null || req.Pairs.Count == 0)
                return new BackfillMonthResult();

            var monthStart = UtcMonthStart(req.Year, req.Month);
            var monthEnd = UtcNextMonth(monthStart);
            int daysInMonth = (int)(monthEnd - monthStart).TotalDays;

            // Подтягиваем существующие транзакции за месяц по всем указанным парам (LinkId == null)
            var devIds = req.Pairs.Select(p => p.DeviceId).Distinct().ToList();
            var rqIds = req.Pairs.Select(p => p.RequisiteId).Distinct().ToList();

            // Забираем только нужные комбинации
            var existing = await _db.PayinTransactionsPublic
                .AsNoTracking()
                .Where(t => t.LinkId == null
                    && t.Date >= monthStart && t.Date < monthEnd
                    && t.DeviceId != null && t.RequisiteId != null
                    && devIds.Contains(t.DeviceId.Value)
                    && rqIds.Contains(t.RequisiteId.Value))
                .Select(t => new { t.DeviceId, t.RequisiteId, t.Date })
                .ToListAsync(ct);

            // Счётчики на месяц и по дням для каждой пары
            // key = "deviceId:requisiteId"
            var monthlyCount = new Dictionary<string, int>();
            var dailyCount = new Dictionary<string, int[]>(); // per-day array

            int[] EmptyDays() => Enumerable.Repeat(0, daysInMonth).ToArray();

            foreach (var pair in req.Pairs)
            {
                var key = $"{pair.DeviceId}:{pair.RequisiteId}";
                monthlyCount[key] = 0;
                dailyCount[key] = EmptyDays();
            }

            foreach (var e in existing)
            {
                var key = $"{e.DeviceId}:{e.RequisiteId}";
                if (!monthlyCount.ContainsKey(key)) continue;
                monthlyCount[key] += 1;
                var dayIndex = (e.Date.Date - monthStart).Days;
                if (dayIndex >= 0 && dayIndex < daysInMonth)
                    dailyCount[key][dayIndex] += 1;
            }

            // Остатки по лимитам и рабочие структуры
            var remainMonthly = new Dictionary<string, int>();
            var remainDaily = new Dictionary<string, int[]>(); // копия с учётом уже существующих

            foreach (var pair in req.Pairs)
            {
                var key = $"{pair.DeviceId}:{pair.RequisiteId}";
                var usedMonth = monthlyCount[key];
                var remMonth = Math.Max(0, pair.MonthlyLimit - usedMonth);
                remainMonthly[key] = remMonth;

                var perDay = new int[daysInMonth];
                var usedPerDay = dailyCount[key];
                for (int d = 0; d < daysInMonth; d++)
                {
                    perDay[d] = Math.Max(0, pair.DailyLimit - usedPerDay[d]);
                }
                remainDaily[key] = perDay;
            }

            // Итоговый «пул» сколько в принципе можно ещё создать
            int overallCapacity = remainMonthly.Values.Sum();
            if (overallCapacity <= 0) return new BackfillMonthResult();

            int hardCap = req.MaxTotalCount.HasValue ? Math.Min(req.MaxTotalCount.Value, overallCapacity) : overallCapacity;

            // Список пар, которые ещё имеют дневной и месячный остаток хотя бы на один день
            bool PairHasAnyDay(string key)
            {
                if (remainMonthly[key] <= 0) return false;
                var arr = remainDaily[key];
                for (int i = 0; i < arr.Length; i++) if (arr[i] > 0) return true;
                return false;
            }

            var activeKeys = remainMonthly.Keys.Where(PairHasAnyDay).ToList();
            var toInsert = new List<PayinTransactionPublic>();
            var result = new BackfillMonthResult();

            // Быстрая адресация PairConfig по ключу
            var pairMap = req.Pairs.ToDictionary(p => $"{p.DeviceId}:{p.RequisiteId}");

            // Генерация: каждый шаг — случайная пара из доступных, затем случайный день с остатком
            for (int i = 0; i < hardCap && activeKeys.Count > 0; i++)
            {
                var key = activeKeys[_rnd.Next(activeKeys.Count)];
                var cfg = pairMap[key];

                // выбираем случайный день с остатком
                var days = remainDaily[key];
                // соберём список индексов дней с остатком (лениво)
                List<int> possibleDays = null;
                // небольшая оптимизация: не делать новый список на каждом шаге
                // (для простоты сейчас сделаем — этого хватит)
                possibleDays = new List<int>(daysInMonth);
                for (int d = 0; d < days.Length; d++)
                    if (days[d] > 0) possibleDays.Add(d);

                if (possibleDays.Count == 0)
                {
                    activeKeys.Remove(key);
                    continue;
                }

                int dayIndex = possibleDays[_rnd.Next(possibleDays.Count)];

                // случайное время внутри суток (UTC)
                var dayStart = monthStart.AddDays(dayIndex);
                var dt = dayStart.AddHours(_rnd.Next(0, 24))
                                 .AddMinutes(_rnd.Next(0, 60))
                                 .AddSeconds(_rnd.Next(0, 60));

                // суммы и статус
                var deal = RandomMoney(cfg.MinAmountUsdt, cfg.MaxAmountUsdt);
                var income = RandomMoney(cfg.MinAmountUsdt, Math.Min(cfg.MaxAmountUsdt, deal));
                var status = RandomStatus();

                toInsert.Add(new PayinTransactionPublic
                {
                    LinkId = null, // важно!
                    DeviceId = cfg.DeviceId,
                    RequisiteId = cfg.RequisiteId,
                    Date = dt,
                    Status = status,
                    DealAmount = deal,
                    IncomeAmount = income
                });

                // Обновляем остатки
                remainMonthly[key] -= 1;
                days[dayIndex] -= 1;
                if (days[dayIndex] <= 0)
                {
                    // если весь день исчерпан — просто дальше не выберется
                }
                if (remainMonthly[key] <= 0 || !PairHasAnyDay(key))
                    activeKeys.Remove(key);

                // учёт результата
                if (!result.ByPair.ContainsKey(key)) result.ByPair[key] = 0;
                result.ByPair[key] += 1;
            }

            if (toInsert.Count > 0)
            {
                await _db.PayinTransactionsPublic.AddRangeAsync(toInsert, ct);
                await _db.SaveChangesAsync(ct);
            }

            result.Created = toInsert.Count;
            return result;
        }
    }
}
