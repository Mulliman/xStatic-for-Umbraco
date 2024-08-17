using System.Collections.Generic;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;

namespace XStatic.Core.Models
{
    public class SafeDeploymentTargetModel(IDeploymentTarget deploymentTarget)
    {
        public int Id { get; } = deploymentTarget.Id;

        public string Name { get; } = deploymentTarget.Name;

        public string DeployerDefinition { get; } = deploymentTarget.DeployerDefinition;
    }

    public class DeploymentTargetModel(IDeploymentTarget deploymentTarget, IDeployerDefinition details) : SafeDeploymentTargetModel(deploymentTarget)
    {
        public string Help { get; } = details.Help;

        public IEnumerable<DeployerField> Fields { get; } = CombineFields(deploymentTarget, details);

        private static IEnumerable<DeployerField> CombineFields(IDeploymentTarget deploymentTarget, IDeployerDefinition details)
        {
            foreach (var item in details.Fields)
            {
                var match = deploymentTarget.Config.TryGetValue(item.Name, out string value) ? value : null;

                yield return new DeployerField
                {
                    Alias = item.Alias,
                    Name = item.Name,
                    EditorUiAlias = item.EditorUiAlias,
                    Value = match ?? item.Value,
                    Help = item.Help
                };
            }
        }
    }
}