using System;
using System.Collections.Generic;
using System.Linq;

namespace XStatic.Core.Deploy.Targets.Creators
{
    public class DeploymentTargetCreatorService(Dictionary<string, Func<Dictionary<string, string>, IDeploymentTargetCreator>> targetCreators, 
        Dictionary<string, IDeploymentTargetCreatorDefinition> targetCreatorsDefinitions) : IDeploymentTargetCreatorService
    {
        private readonly Dictionary<string, Func<Dictionary<string, string>, IDeploymentTargetCreator>> _targetCreators = targetCreators;
        private readonly Dictionary<string, IDeploymentTargetCreatorDefinition> _targetCreatorsDefinitions = targetCreatorsDefinitions;

        public IDeploymentTargetCreatorDefinition GetDefinition(string id)
        {
            if (!_targetCreatorsDefinitions.ContainsKey(id))
            {
                return null;
            }

            return _targetCreatorsDefinitions[id];
        }

        public IEnumerable<IDeploymentTargetCreatorDefinition> GetDefinitions()
        {
            return _targetCreatorsDefinitions.Select(d => d.Value);
        }

        public IDeploymentTargetCreator GetDeploymentTargetCreator(string deployerKey, Dictionary<string, string> properties)
        {
            if (!_targetCreators.ContainsKey(deployerKey))
            {
                throw new ArgumentException("No deployment target creator found with ID " + deployerKey, nameof(deployerKey));
            }

            var func = _targetCreators[deployerKey];

            return func.Invoke(properties);
        }
    }
}
