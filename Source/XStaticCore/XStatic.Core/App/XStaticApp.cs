using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System;
using XStatic.Deploy.Configuration;
using XStatic.Generator.Startup;

namespace XStatic.Core.App
{
    public class XStaticServiceBuilder
    {
        private IServiceCollection _services;

        public GeneratorServiceBuilder GeneratorServiceBuilder { get; }

        public DeployServiceBuilder DeployServiceBuilder { get; }

        public XStaticServiceBuilder(IServiceCollection services)
        {
            _services = services;
            GeneratorServiceBuilder = new GeneratorServiceBuilder(_services);
            DeployServiceBuilder = new DeployServiceBuilder(_services);
        }

        public XStaticServiceBuilder Automatic()
        {
            GeneratorServiceBuilder.AddDefaults();
            DeployServiceBuilder.AddDeployersAutomatically();

            return this;
        }

        public XStaticServiceBuilder Build()
        {
            GeneratorServiceBuilder.Build();
            DeployServiceBuilder.Build();

            return this;
        }
    }

    public static class XStaticAppExtensions
    {
        public static XStaticServiceBuilder AddXStatic(this IServiceCollection services)
        {
            return new XStaticServiceBuilder(services);
        }
    }
}