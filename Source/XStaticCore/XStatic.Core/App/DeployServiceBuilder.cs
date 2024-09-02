using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Creators;

namespace XStatic.Core.App
{
    public class DeployServiceBuilder(IServiceCollection services) : IDeployServiceBuilder
    {
        public readonly Dictionary<string, Func<Dictionary<string, string>, IDeployer>> _deployers = [];
        public readonly Dictionary<string, IDeployerDefinition> _definitions = [];

        public readonly Dictionary<string, Func<Dictionary<string, string>, IDeploymentTargetCreator>> _targetCreators = [];
        public readonly Dictionary<string, IDeploymentTargetCreatorDefinition> _targetCreatorsDefinitions = [];

        public readonly IServiceCollection _services = services;

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

        public IDeployServiceBuilder AddDeploymentTargetCreator(IDeploymentTargetCreatorDefinition definition, Func<Dictionary<string, string>, IDeploymentTargetCreator> constructor)
        {
            _targetCreators.Add(definition.Id, constructor);
            _targetCreatorsDefinitions.Add(definition.Id, definition);

            return this;
        }

        public IDeployServiceBuilder AddDeploymentTargetCreatorsAutomatically()
        {
            var deployerInstallers = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(x => x.GetTypes())
                .Where(x => typeof(IDeploymentTargetCreatorAutoInstaller).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
                .ToList();

            foreach (var installer in deployerInstallers)
            {
                var instance = Activator.CreateInstance(installer) as IDeploymentTargetCreatorAutoInstaller;

                _targetCreators.Add(instance.Definition.Id, instance.Constructor);
                _targetCreatorsDefinitions.Add(instance.Definition.Id, instance.Definition);
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

            var targetFactory = new DeploymentTargetCreatorService(_targetCreators, _targetCreatorsDefinitions);
            _services.AddSingleton<IDeploymentTargetCreatorService>(targetFactory);

            AddDefaultDeploymentTargetServices();
        }
    }
}