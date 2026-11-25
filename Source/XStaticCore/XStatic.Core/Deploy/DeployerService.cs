using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Secrets;

namespace XStatic.Core.Deploy
{
    public class DeployerService : IDeployerService
    {
        private readonly Dictionary<string, Func<Dictionary<string, string>, IDeployer>> _deployerBuilderDictionary;
        private readonly Dictionary<string, IDeployerDefinition> _definitions;
        private readonly ISecretReferenceResolver _secretResolver;

        public DeployerService(Dictionary<string, Func<Dictionary<string, string>, IDeployer>> deployerBuilderDictionary, Dictionary<string, IDeployerDefinition> definitions)
            : this(deployerBuilderDictionary, definitions, null)
        {
        }

        /// <param name="secretResolver">
        /// Resolves <c>${env:...}</c> and <c>${config:...}</c> references in a target's settings before the deployer
        /// is created. When <c>null</c>, settings are passed on exactly as stored.
        /// </param>
        public DeployerService(Dictionary<string, Func<Dictionary<string, string>, IDeployer>> deployerBuilderDictionary, Dictionary<string, IDeployerDefinition> definitions, ISecretReferenceResolver secretResolver)
        {
            _deployerBuilderDictionary = deployerBuilderDictionary;
            _definitions = definitions;
            _secretResolver = secretResolver;
        }

        /// <exception cref="SecretReferenceException">A secret reference in <paramref name="properties"/> can't be resolved.</exception>
        public IDeployer GetDeployer(string deployerKey, Dictionary<string, string> properties)
        {
            if (!_deployerBuilderDictionary.ContainsKey(deployerKey))
            {
                throw new ArgumentException("No deployer found with ID " + deployerKey, nameof(deployerKey));
            }

            var func = _deployerBuilderDictionary[deployerKey];

            var resolved = _secretResolver != null ? _secretResolver.Resolve(properties) : properties;

            return func.Invoke(resolved);
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
