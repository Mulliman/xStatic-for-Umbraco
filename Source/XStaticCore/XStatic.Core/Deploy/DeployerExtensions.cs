using Microsoft.Extensions.DependencyInjection;
using XStatic.Deploy.Configuration;

namespace XStatic.Deploy
{
    public static class DeployerExtensions
    {
        public static IDeployConfigurationBuilder AddXStaticDeploy(this IServiceCollection services)
        {
            return new DeployConfigurationBuilder(services);
        }
    }
}