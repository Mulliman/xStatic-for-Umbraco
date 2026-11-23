using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace XStatic.Core.Models
{
    public class ActionUpdateModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Type { get; set; }

        [JsonConverter(typeof(StringValueDictionaryJsonConverter))]
        public Dictionary<string, string> Config { get; set; }
    }
}