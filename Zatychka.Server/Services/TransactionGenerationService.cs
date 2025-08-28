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
            //var x = _rnd.NextDouble(); // [0,1)
            //if (x < 0.005) return "Заморожена";
            //if (x < 0.015) return "Создана";
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

        // ======== ДОБАВЛЕНО: калькуляция дохода по правилам ========
        const string SpecialEmail = "morphio.qwe2@gmail.com";

        decimal CalcIncomePublic(decimal deal)
            => Math.Round(deal * 1.065m, 2, MidpointRounding.AwayFromZero); // строго +6.5% всегда

        decimal CalcIncomePrivate(decimal deal, string? userEmail)
        {
            if (!string.IsNullOrEmpty(userEmail) &&
                userEmail.Equals(SpecialEmail, StringComparison.OrdinalIgnoreCase))
            {
                return Math.Round(deal * 1.120m, 2, MidpointRounding.AwayFromZero); // +12.5% только для этого юзера
            }
            return Math.Round(deal * 1.065m, 2, MidpointRounding.AwayFromZero);      // иначе +6.5%
        }

        // ============================================================
        // NEW ADMINKA
        // ============================================================

        public sealed class ExactSumGenerateResult
        {
            public int Created { get; set; }
        }

        public async Task<ExactSumGenerateResult> GenerateExactSumAsync(
            DateTime dayUtc,
            int count,
            decimal min,
            decimal max,
            decimal total,
            bool isPrivate,
            CancellationToken ct = default)
        {
            if (count <= 0) throw new ArgumentOutOfRangeException(nameof(count));
            if (min < 0m) throw new ArgumentOutOfRangeException(nameof(min));
            if (max < min) max = min;

            int ToCents(decimal d) => (int)Math.Round(d * 100m, MidpointRounding.AwayFromZero);
            decimal FromCents(int c) => c / 100m;

            var totalC = ToCents(total);
            var minC = ToCents(min);
            var maxC = ToCents(max);

            long lo = (long)minC * count;
            long hi = (long)maxC * count;
            if (totalC < lo || totalC > hi)
                throw new ArgumentException("TotalAmount must satisfy Count*Min ≤ Total ≤ Count*Max");

            var parts = SplitExactRandom(totalC, count, minC, maxC);

            // для приватных нам нужен email пользователя, поэтому подтягиваем User
            var links = await _db.Links.Include(l => l.User).Where(l => l.IsActive).ToListAsync(ct);
            if (links.Count == 0) throw new InvalidOperationException("Нет активных связок Link");

            var day = new DateTime(dayUtc.Year, dayUtc.Month, dayUtc.Day, 0, 0, 0, DateTimeKind.Utc);

            if (isPrivate)
            {
                var toInsertPr = new List<PayinTransactionPrivate>(count);
                for (int i = 0; i < count; i++)
                {
                    var link = links[_rnd.Next(links.Count)];
                    var deal = FromCents(parts[i]);
                    var income = CalcIncomePrivate(deal, link.User?.Email);

                    var dt = day
                        .AddHours(_rnd.Next(0, 24))
                        .AddMinutes(_rnd.Next(0, 60))
                        .AddSeconds(_rnd.Next(0, 60));
                    var statusStr = RandomStatus();
                    var statusEnum = statusStr switch
                    {
                        "Заморожена" => PayinStatus.Frozen,
                        "Создана" => PayinStatus.Created,
                        _ => PayinStatus.Completed
                    };

                    toInsertPr.Add(new PayinTransactionPrivate
                    {
                        UserId = link.UserId,
                        DeviceId = link.DeviceId,
                        RequisiteId = link.RequisiteId,
                        Date = dt,
                        Status = statusEnum,
                        DealAmount = deal,
                        IncomeAmount = income
                    });
                }

                await _db.PayinTransactionsPrivate.AddRangeAsync(toInsertPr, ct);
                await _db.SaveChangesAsync(ct);
                return new ExactSumGenerateResult { Created = toInsertPr.Count };
            }
            else
            {
                var toInsertPb = new List<PayinTransactionPublic>(count);
                for (int i = 0; i < count; i++)
                {
                    var link = links[_rnd.Next(links.Count)];
                    var deal = FromCents(parts[i]);
                    var income = CalcIncomePublic(deal);

                    var dt = day
                        .AddHours(_rnd.Next(0, 24))
                        .AddMinutes(_rnd.Next(0, 60))
                        .AddSeconds(_rnd.Next(0, 60));

                    var status = RandomStatus();

                    toInsertPb.Add(new PayinTransactionPublic
                    {
                        LinkId = link.Id,
                        DeviceId = link.DeviceId,
                        RequisiteId = link.RequisiteId,
                        Date = dt,
                        Status = status,
                        DealAmount = deal,
                        IncomeAmount = income
                    });
                }

                await _db.PayinTransactionsPublic.AddRangeAsync(toInsertPb, ct);
                await _db.SaveChangesAsync(ct);
                return new ExactSumGenerateResult { Created = toInsertPb.Count };
            }
        }

        private int[] SplitExactRandom(int totalC, int count, int minC, int maxC)
        {
            var adds = new int[count];
            var remaining = totalC - minC * count;
            var cap = maxC - minC;

            for (int i = 0; i < count; i++)
            {
                int left = count - i - 1;
                int low = Math.Max(0, remaining - cap * left);
                int high = Math.Min(cap, remaining);
                int give = (low == high) ? low : _rnd.Next(low, high + 1);
                adds[i] = give;
                remaining -= give;
            }

            var parts = new int[count];
            for (int i = 0; i < count; i++) parts[i] = minC + adds[i];

            for (int i = parts.Length - 1; i > 0; i--)
            {
                int j = _rnd.Next(i + 1);
                (parts[i], parts[j]) = (parts[j], parts[i]);
            }

            var sum = parts.Sum();
            if (sum != totalC)
            {
                int diff = totalC - sum;
                int dir = Math.Sign(diff);
                diff = Math.Abs(diff);
                for (int k = 0; k < diff; k++) parts[k % parts.Length] += dir;
            }

            return parts;
        }

        // ============================================================
        // Генерация в приватную таблицу
        // ============================================================

        public class GeneratePrivateResult
        {
            public int Created { get; set; }
            public Dictionary<int, int> ByLink { get; set; } = new();
            public List<int> SkippedInactive { get; set; } = new();
        }

        public async Task<GeneratePrivateResult> GeneratePrivateAsync(GenerateRequest req, CancellationToken ct = default)
        {
            var result = new GeneratePrivateResult();
            if (req.Count <= 0 || req.LinkIds.Count == 0) return result;

            var links = await _db.Links.Include(l => l.User).Where(l => req.LinkIds.Contains(l.Id)).ToListAsync(ct);
            var active = links.Where(l => l.IsActive).ToList();
            result.SkippedInactive = links.Where(l => !l.IsActive).Select(l => l.Id).ToList();
            if (active.Count == 0) return result;

            var nowUtc = DateTime.UtcNow;
            var today = DateTime.UtcNow.Date;
            var mFrom = new DateTime(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var mTo = mFrom.AddMonths(1);

            var counters = new Dictionary<int, (int total, int daily, int monthly)>();
            foreach (var l in active)
            {
                var total = await _db.PayinTransactionsPrivate.CountAsync(x => x.DeviceId == l.DeviceId && x.RequisiteId == l.RequisiteId && x.UserId == l.UserId, ct);
                var daily = await _db.PayinTransactionsPrivate.CountAsync(x => x.DeviceId == l.DeviceId && x.RequisiteId == l.RequisiteId && x.UserId == l.UserId && x.Date >= today && x.Date < today.AddDays(1), ct);
                var monthly = await _db.PayinTransactionsPrivate.CountAsync(x => x.DeviceId == l.DeviceId && x.RequisiteId == l.RequisiteId && x.UserId == l.UserId && x.Date >= mFrom && x.Date < mTo, ct);
                counters[l.Id] = (total, daily, monthly);
            }

            int Capacity(Link l)
            {
                var c = counters[l.Id];
                var t = l.TotalTxCountLimit.HasValue ? (l.TotalTxCountLimit.Value - c.total) : int.MaxValue;
                var d = l.DailyTxCountLimit.HasValue ? (l.DailyTxCountLimit.Value - c.daily) : int.MaxValue;
                var m = l.MonthlyTxCountLimit.HasValue ? (l.MonthlyTxCountLimit.Value - c.monthly) : int.MaxValue;
                return Math.Max(0, Math.Min(t, Math.Min(d, m)));
            }

            var toInsert = new List<PayinTransactionPrivate>();
            for (int i = 0; i < req.Count; i++)
            {
                var candidates = active.Where(l => Capacity(l) > 0).ToList();
                if (candidates.Count == 0) break;

                var link = candidates[_rnd.Next(candidates.Count)];
                var deal = RandomMoney(link.MinAmountUsdt, link.MaxAmountUsdt);
                var income = CalcIncomePrivate(deal, link.User?.Email);
                var status = RandomStatus(); // "Заморожена" | "Создана" | "Выполнена"

                toInsert.Add(new PayinTransactionPrivate
                {
                    UserId = link.UserId,
                    DeviceId = link.DeviceId,
                    RequisiteId = link.RequisiteId,
                    Date = nowUtc,
                    Status = status switch
                    {
                        "Заморожена" => PayinStatus.Frozen,
                        "Создана" => PayinStatus.Created,
                        _ => PayinStatus.Completed
                    },
                    DealAmount = deal,
                    IncomeAmount = income
                });

                var c = counters[link.Id];
                counters[link.Id] = (c.total + 1, c.daily + 1, c.monthly + 1);
                if (!result.ByLink.ContainsKey(link.Id)) result.ByLink[link.Id] = 0;
                result.ByLink[link.Id] += 1;
            }

            if (toInsert.Count > 0)
            {
                await _db.PayinTransactionsPrivate.AddRangeAsync(toInsert, ct);
                await _db.SaveChangesAsync(ct);
            }

            result.Created = toInsert.Count;
            return result;
        }

        // ============================================================
        // Бэкоф за месяц (PRIVATE)
        // ============================================================

        public class BackfillMonthPrivateRequest
        {
            public int Year { get; set; }
            public int Month { get; set; }
            public int? MaxTotalCount { get; set; }
            public List<PairConfig> Pairs { get; set; } = new();

            public class PairConfig
            {
                public int UserId { get; set; }
                public int DeviceId { get; set; }
                public int RequisiteId { get; set; }
                public decimal MinAmountUsdt { get; set; }
                public decimal MaxAmountUsdt { get; set; }
                public int DailyLimit { get; set; }
                public int MonthlyLimit { get; set; }
            }
        }

        public class BackfillMonthPrivateResult
        {
            public int Created { get; set; }
            public Dictionary<string, int> ByPair { get; set; } = new();
        }

        public async Task<BackfillMonthPrivateResult> BackfillMonthPrivateAsync(BackfillMonthPrivateRequest req, CancellationToken ct = default)
        {
            if (req.Year < 2000 || req.Month is < 1 or > 12) throw new ArgumentException("Некорректный месяц/год");
            if (req.Pairs == null || req.Pairs.Count == 0) return new BackfillMonthPrivateResult();

            var monthStart = new DateTime(req.Year, req.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var monthEnd = monthStart.AddMonths(1);
            var daysInMonth = (int)(monthEnd - monthStart).TotalDays;

            var devIds = req.Pairs.Select(p => p.DeviceId).Distinct().ToList();
            var rqIds = req.Pairs.Select(p => p.RequisiteId).Distinct().ToList();
            var usIds = req.Pairs.Select(p => p.UserId).Distinct().ToList();

            var existing = await _db.PayinTransactionsPrivate
                .AsNoTracking()
                .Where(t => t.Date >= monthStart && t.Date < monthEnd
                            && t.DeviceId != null && t.RequisiteId != null
                            && devIds.Contains(t.DeviceId!.Value)
                            && rqIds.Contains(t.RequisiteId!.Value)
                            && usIds.Contains(t.UserId))
                .Select(t => new { t.UserId, t.DeviceId, t.RequisiteId, t.Date })
                .ToListAsync(ct);

            // подтянем емейлы пользователей один раз
            var userEmails = await _db.Users
                .Where(u => usIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Email })
                .ToDictionaryAsync(x => x.Id, x => x.Email, ct);

            string Key(int u, int d, int r) => $"{u}:{d}:{r}";
            int[] EmptyDays() => Enumerable.Repeat(0, daysInMonth).ToArray();

            var monthly = new Dictionary<string, int>();
            var perDay = new Dictionary<string, int[]>();
            foreach (var p in req.Pairs)
            {
                var k = Key(p.UserId, p.DeviceId, p.RequisiteId);
                monthly[k] = 0;
                perDay[k] = EmptyDays();
            }
            foreach (var e in existing)
            {
                var k = Key(e.UserId, e.DeviceId!.Value, e.RequisiteId!.Value);
                if (!monthly.ContainsKey(k)) continue;
                monthly[k] += 1;
                var idx = (e.Date.Date - monthStart).Days;
                if (idx >= 0 && idx < daysInMonth) perDay[k][idx] += 1;
            }

            var remainMonth = new Dictionary<string, int>();
            var remainDay = new Dictionary<string, int[]>();
            foreach (var p in req.Pairs)
            {
                var k = Key(p.UserId, p.DeviceId, p.RequisiteId);
                var used = monthly[k];
                remainMonth[k] = Math.Max(0, p.MonthlyLimit - used);

                var arr = new int[daysInMonth];
                var usedDays = perDay[k];
                for (int i = 0; i < daysInMonth; i++)
                    arr[i] = Math.Max(0, p.DailyLimit - usedDays[i]);
                remainDay[k] = arr;
            }

            int overall = remainMonth.Values.Sum();
            if (overall <= 0) return new BackfillMonthPrivateResult();

            var hardCap = req.MaxTotalCount.HasValue ? Math.Min(req.MaxTotalCount.Value, overall) : overall;

            bool HasAnyDay(string k)
            {
                if (remainMonth[k] <= 0) return false;
                var a = remainDay[k];
                for (int i = 0; i < a.Length; i++) if (a[i] > 0) return true;
                return false;
            }

            var activeKeys = remainMonth.Keys.Where(HasAnyDay).ToList();
            var result = new BackfillMonthPrivateResult();
            var toInsert = new List<PayinTransactionPrivate>();
            var map = req.Pairs.ToDictionary(p => Key(p.UserId, p.DeviceId, p.RequisiteId));

            for (int i = 0; i < hardCap && activeKeys.Count > 0; i++)
            {
                var k = activeKeys[_rnd.Next(activeKeys.Count)];
                var cfg = map[k];

                var days = remainDay[k];
                var options = new List<int>();
                for (int d = 0; d < days.Length; d++) if (days[d] > 0) options.Add(d);
                if (options.Count == 0) { activeKeys.Remove(k); continue; }

                var dayIndex = options[_rnd.Next(options.Count)];
                var dt = monthStart.AddDays(dayIndex)
                                   .AddHours(_rnd.Next(0, 24))
                                   .AddMinutes(_rnd.Next(0, 60))
                                   .AddSeconds(_rnd.Next(0, 60));

                var deal = RandomMoney(cfg.MinAmountUsdt, cfg.MaxAmountUsdt);

                userEmails.TryGetValue(cfg.UserId, out var email);
                var income = CalcIncomePrivate(deal, email);

                var status = RandomStatus();

                toInsert.Add(new PayinTransactionPrivate
                {
                    UserId = cfg.UserId,
                    DeviceId = cfg.DeviceId,
                    RequisiteId = cfg.RequisiteId,
                    Date = dt,
                    Status = status switch
                    {
                        "Заморожена" => PayinStatus.Frozen,
                        "Создана" => PayinStatus.Created,
                        _ => PayinStatus.Completed
                    },
                    DealAmount = deal,
                    IncomeAmount = income
                });

                remainMonth[k] -= 1;
                days[dayIndex] -= 1;
                if (remainMonth[k] <= 0 || !HasAnyDay(k)) activeKeys.Remove(k);

                if (!result.ByPair.ContainsKey(k)) result.ByPair[k] = 0;
                result.ByPair[k] += 1;
            }

            if (toInsert.Count > 0)
            {
                await _db.PayinTransactionsPrivate.AddRangeAsync(toInsert, ct);
                await _db.SaveChangesAsync(ct);
            }

            result.Created = toInsert.Count;
            return result;
        }

        // ============================================================
        // Пакетная генерация (PUBLIC)
        // ============================================================

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

            var links = await _db.Links
                .Where(l => req.LinkIds.Contains(l.Id))
                .ToListAsync(ct);

            var activeLinks = links.Where(l => l.IsActive).ToList();
            result.SkippedInactive = links.Where(l => !l.IsActive).Select(l => l.Id).ToList();

            if (activeLinks.Count == 0) return result;

            var nowUtc = DateTime.UtcNow;
            var today = UtcToday();
            var (mFrom, mTo) = UtcMonthRange(nowUtc);

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
                var candidateIds = counters.Where(kv => kv.Value.AnyCapacity)
                                           .Select(kv => kv.Key)
                                           .ToList();
                if (candidateIds.Count == 0) break;

                var linkId = candidateIds[_rnd.Next(candidateIds.Count)];
                var link = activeLinks.First(l => l.Id == linkId);
                var st = counters[linkId];

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

                var deal = RandomMoney(link.MinAmountUsdt, link.MaxAmountUsdt);
                var income = CalcIncomePublic(deal);
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

        // ============================================================
        // Бэкоф за месяц (PUBLIC)
        // ============================================================

        public async Task<BackfillMonthResult> BackfillMonthAsync(BackfillMonthRequest req, CancellationToken ct = default)
        {
            if (req.Year < 2000 || req.Month < 1 || req.Month > 12)
                throw new ArgumentException("Некорректный месяц/год");

            if (req.Pairs == null || req.Pairs.Count == 0)
                return new BackfillMonthResult();

            var monthStart = UtcMonthStart(req.Year, req.Month);
            var monthEnd = UtcNextMonth(monthStart);
            int daysInMonth = (int)(monthEnd - monthStart).TotalDays;

            var devIds = req.Pairs.Select(p => p.DeviceId).Distinct().ToList();
            var rqIds = req.Pairs.Select(p => p.RequisiteId).Distinct().ToList();

            var existing = await _db.PayinTransactionsPublic
                .AsNoTracking()
                .Where(t => t.LinkId == null
                    && t.Date >= monthStart && t.Date < monthEnd
                    && t.DeviceId != null && t.RequisiteId != null
                    && devIds.Contains(t.DeviceId.Value)
                    && rqIds.Contains(t.RequisiteId.Value))
                .Select(t => new { t.DeviceId, t.RequisiteId, t.Date })
                .ToListAsync(ct);

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

            var remainMonthly = new Dictionary<string, int>();
            var remainDaily = new Dictionary<string, int[]>();

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

            int overallCapacity = remainMonthly.Values.Sum();
            if (overallCapacity <= 0) return new BackfillMonthResult();

            int hardCap = req.MaxTotalCount.HasValue ? Math.Min(req.MaxTotalCount.Value, overallCapacity) : overallCapacity;

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

            var pairMap = req.Pairs.ToDictionary(p => $"{p.DeviceId}:{p.RequisiteId}");

            for (int i = 0; i < hardCap && activeKeys.Count > 0; i++)
            {
                var key = activeKeys[_rnd.Next(activeKeys.Count)];
                var cfg = pairMap[key];

                var days = remainDaily[key];
                List<int> possibleDays = new List<int>(daysInMonth);
                for (int d = 0; d < days.Length; d++)
                    if (days[d] > 0) possibleDays.Add(d);

                if (possibleDays.Count == 0)
                {
                    activeKeys.Remove(key);
                    continue;
                }

                int dayIndex = possibleDays[_rnd.Next(possibleDays.Count)];

                var dayStart = monthStart.AddDays(dayIndex);
                var dt = dayStart.AddHours(_rnd.Next(0, 24))
                                 .AddMinutes(_rnd.Next(0, 60))
                                 .AddSeconds(_rnd.Next(0, 60));

                var deal = RandomMoney(cfg.MinAmountUsdt, cfg.MaxAmountUsdt);
                var income = CalcIncomePublic(deal);
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

                remainMonthly[key] -= 1;
                days[dayIndex] -= 1;
                if (remainMonthly[key] <= 0 || !PairHasAnyDay(key))
                    activeKeys.Remove(key);

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
