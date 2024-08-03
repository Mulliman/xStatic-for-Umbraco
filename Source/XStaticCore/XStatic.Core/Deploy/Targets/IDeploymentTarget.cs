using System.Collections.Generic;

namespace XStatic.Core.Deploy.Targets
{
    public interface IDeploymentTarget
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string DeployerDefinition { get; set; }

        public Dictionary<string, string> Config { get; set; }
    }
}