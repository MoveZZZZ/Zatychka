using System.Runtime.Serialization;

namespace Zatychka.Server.Models
{
    public enum PayinStatus
    {
        [EnumMember(Value = "Создана")]
        Created = 0,     // Создана
        [EnumMember(Value = "Выполнена")]
        Completed = 1,   // Выполнена
        [EnumMember(Value = "Заморожена")]
        Frozen = 2       // Заморожена
    }
}
