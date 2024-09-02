using System.Collections.Generic;

namespace XStatic.Core.Models
{
    public class DeploymentTargetCreatorPostModel
    {
        public string Name { get; set; }

        public string Creator { get; set; }

        public Dictionary<string, string> Fields { get; set; }
    }
}