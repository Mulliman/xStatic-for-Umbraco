using Microsoft.Extensions.DependencyInjection;
using XStatic.Core.App;
using XStatic.Netlify.Actions;

namespace XStatic.Netlify
{
    public static class NetlifyExtensions
    {
        public static IDeployServiceBuilder AddNetlifyDeployer(this IDeployServiceBuilder builder)
        {
            builder.AddDeployer(new NetlifyDeployerDefinition(), (x) => new NetlifyDeployer(x));
            builder.AddDeployer(new NetlifyLegacyDeployerDefinition(), (x) => new NetlifyDeployerLegacy(x));

            return builder;
        }

        public static IServiceCollection AddNetlifyActions(this IServiceCollection services)
        {
            services.AddTransient<Netlify404Action>();

            return services;
        }
    }
}