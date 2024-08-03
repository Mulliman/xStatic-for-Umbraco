using System.Collections.Generic;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;

namespace XStatic.Core.Models
{
    public class DeploymentTargetModel
    {
        public DeploymentTargetModel(IDeploymentTarget deploymentTarget, IDeployerDefinition details)
        {
            Id = deploymentTarget.Id;
            Name = deploymentTarget.Name;
            DeployerDefinition = deploymentTarget.DeployerDefinition;
            Help = details.Help;
            Fields = CombineFields(deploymentTarget, details);
        }

        public int Id { get; }

        public string Name { get; }

        public string DeployerDefinition { get; }

        public string Help { get; }

        public IEnumerable<DeployerField> Fields { get; }

        private static IEnumerable<DeployerField> CombineFields(IDeploymentTarget deploymentTarget, IDeployerDefinition details)
        {
            foreach (var item in details.Fields)
            {
                var match = deploymentTarget.Config.TryGetValue(item.Name, out string value) ? value : null;

                yield return new DeployerField
                {
                    Name = item.Name,
                    EditorUiAlias = item.EditorUiAlias,
                    Value = match ?? item.Value,
                    Help = item.Help
                };
            }
        }
    }
}