using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;

namespace XStatic.Deploy.Configuration
{
    public class DeployConfigurationBuilder : IDeployConfigurationBuilder
    {
        public readonly Dictionary<string, Func<Dictionary<string, string>, IDeployer>> _deployers;
        public readonly Dictionary<string, IDeployerDefinition> _definitions;
        public readonly IServiceCollection _services;

        public DeployConfigurationBuilder(IServiceCollection services)
        {
            _deployers = new Dictionary<string, Func<Dictionary<string, string>, IDeployer>>();
            _definitions = new Dictionary<string, IDeployerDefinition>();
            _services = services;
        }

        public IDeployConfigurationBuilder AddDeployer(IDeployerDefinition definition, Func<Dictionary<string, string>, IDeployer> deployerConstructor)
        {
            _deployers.Add(definition.Id, deployerConstructor);
            _definitions.Add(definition.Id, definition);

            return this;
        }

        public void Build()
        {
            var factory = new DeployerService(_deployers, _definitions);

            _services.AddSingleton<IDeployerService>(factory);
        }
    }
}