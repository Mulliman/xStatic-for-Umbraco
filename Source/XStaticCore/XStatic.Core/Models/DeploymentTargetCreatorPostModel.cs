using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace XStatic.Core.Models
{
    public class DeploymentTargetCreatorPostModel
    {
        public string Name { get; set; }

        public string Creator { get; set; }

        [JsonConverter(typeof(StringValueDictionaryJsonConverter))]
        public Dictionary<string, string> Fields { get; set; }
    }
}