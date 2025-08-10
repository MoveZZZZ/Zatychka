namespace Zatychka.Server.DTOs
{
    public class StatisticsTextsDto
    {
        public string PageTitle { get; set; } = "Статистика";
        public IntakeTexts Intake { get; set; } = new();
        public DisputesTexts Disputes { get; set; } = new();

        public class IntakeTexts
        {
            public string Title { get; set; } = "Приём";
            public string TotalTxLabel { get; set; } = "Всего транзакций";
            public string TotalTxSubPrefix { get; set; } = "На сумму";
            public string ActiveTxLabel { get; set; } = "Активных транзакций";
            public string ActiveTxSubPrefix { get; set; } = "На сумму";
            public string SuccessRateLabel { get; set; } = "Успешных транзакций";
            public string ProfitLabel { get; set; } = "Прибыль";
        }

        public class DisputesTexts
        {
            public string Title { get; set; } = "Споры";
            public string TotalLabel { get; set; } = "Всего споров";
            public string ActiveLabel { get; set; } = "Активных споров";
        }
    }
}
