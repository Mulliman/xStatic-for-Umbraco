using System.Collections.Generic;

namespace XStatic.Core.Models
{
    public class DeploymentTargetUpdateModel
    {
        public int Id { get; }

        public string Name { get; set; }

        public string DeployerDefinition { get; set; }

        public Dictionary<string, string> Fields { get; set; }
    }
}