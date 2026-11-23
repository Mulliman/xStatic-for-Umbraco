using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace XStatic.Core.Models
{
    public class DeploymentTargetUpdateModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string DeployerDefinition { get; set; }

        [JsonConverter(typeof(StringValueDictionaryJsonConverter))]
        public Dictionary<string, string> Fields { get; set; }
    }
}