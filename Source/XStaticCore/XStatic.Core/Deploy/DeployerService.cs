using System;
using System.Collections.Generic;
using System.Linq;

namespace XStatic.Core.Deploy
{
    public class DeployerService : IDeployerService
    {
        private readonly Dictionary<string, Func<Dictionary<string, string>, IDeployer>> _deployerBuilderDictionary;
        private readonly Dictionary<string, IDeployerDefinition> _definitions;

        public DeployerService(Dictionary<string, Func<Dictionary<string, string>, IDeployer>> deployerBuilderDictionary, Dictionary<string, IDeployerDefinition> definitions)
        {
            _deployerBuilderDictionary = deployerBuilderDictionary;
            _definitions = definitions;
        }

        public IDeployer GetDeployer(string deployerKey, Dictionary<string, string> properties)
        {
            if (!_deployerBuilderDictionary.ContainsKey(deployerKey))
            {
                throw new ArgumentException("No deployed found with ID " + deployerKey, nameof(deployerKey));
            }

            var func = _deployerBuilderDictionary[deployerKey];

            return func.Invoke(properties);
        }

        public IEnumerable<IDeployerDefinition> GetDefinitions()
        {
            return _definitions.Select(d => d.Value);
        }

        public IDeployerDefinition GetDefinition(string id)
        {
            if (!_definitions.ContainsKey(id))
            {
                return null;
            }

            return _definitions[id];
        }
    }
}
