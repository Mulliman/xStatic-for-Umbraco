using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Actions;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;

namespace XStatic.Core.App
{
    public class DeployServiceBuilder : IDeployServiceBuilder
    {
        public readonly Dictionary<string, Func<Dictionary<string, string>, IDeployer>> _deployers;
        public readonly Dictionary<string, IDeployerDefinition> _definitions;
        public readonly IServiceCollection _services;

        public DeployServiceBuilder(IServiceCollection services)
        {
            _deployers = new Dictionary<string, Func<Dictionary<string, string>, IDeployer>>();
            _definitions = new Dictionary<string, IDeployerDefinition>();
            _services = services;
        }

        public IDeployServiceBuilder AddDeployer(IDeployerDefinition definition, Func<Dictionary<string, string>, IDeployer> deployerConstructor)
        {
            _deployers.Add(definition.Id, deployerConstructor);
            _definitions.Add(definition.Id, definition);

            return this;
        }

        public IDeployServiceBuilder AddDeployersAutomatically()
        {
            var deployerInstallers = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(x => x.GetTypes())
                .Where(x => typeof(IDeployerAutoInstaller).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
                .ToList();

            foreach (var installer in deployerInstallers)
            {
                var instance = Activator.CreateInstance(installer) as IDeployerAutoInstaller;

                _deployers.Add(instance.Definition.Id, instance.Constructor);
                _definitions.Add(instance.Definition.Id, instance.Definition);
            }

            return this;
        }

        public DeployServiceBuilder AddDefaultDeploymentTargetServices()
        {
            _services.AddSingleton<IDeploymentTargetRepository, DeploymentTargetRepository>();

            return this;
        }

        public void Build()
        {
            var factory = new DeployerService(_deployers, _definitions);

            _services.AddSingleton<IDeployerService>(factory);
            AddDefaultDeploymentTargetServices();
        }
    }
}