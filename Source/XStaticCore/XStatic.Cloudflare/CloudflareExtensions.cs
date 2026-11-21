using Microsoft.Extensions.DependencyInjection;
using XStatic.Cloudflare.Actions;
using XStatic.Core.App;

namespace XStatic.Cloudflare
{
    public static class CloudflareExtensions
    {
        public static IDeployServiceBuilder AddCloudflareDeployers(this IDeployServiceBuilder builder)
        {
            builder.AddDeployer(new CloudflarePagesDeployerDefinition(), (x) => new CloudflarePagesDeployer(x));
            builder.AddDeployer(new CloudflareR2DeployerDefinition(), (x) => new CloudflareR2Deployer(x));

            if (builder is DeployServiceBuilder concreteBuilder)
            {
                concreteBuilder.AddDeploymentTargetCreator(
                    new CloudflarePagesDeploymentTargetCreatorDefinition(),
                    (x) => new CloudflarePagesDeploymentTargetCreator(x));
            }

            return builder;
        }

        public static IServiceCollection AddCloudflareActions(this IServiceCollection services)
        {
            services.AddTransient<CloudflareHeadersAction>();
            services.AddTransient<CloudflareRedirectsAction>();

            return services;
        }
    }
}
