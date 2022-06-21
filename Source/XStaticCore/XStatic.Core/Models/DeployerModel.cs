using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Deploy;

namespace XStatic.Core.Models
{
    public class DeployerModel
    {
        public DeployerModel()
        {
        }

        public DeployerModel(IDeployerDefinition details)
        {
            Id = details.Id;
            Name = details.Name;
            Help = details.Help;
            Fields = details.Fields.ToDictionary(f => f, f => "");
        }

        public string Id { get; }

        public string Name { get; }

        public string Help { get; }

        public Dictionary<string, string> Fields { get; }
    }
}