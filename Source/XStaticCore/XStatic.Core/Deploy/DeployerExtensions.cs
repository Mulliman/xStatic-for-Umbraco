using Microsoft.Extensions.DependencyInjection;
using XStatic.Deploy.Configuration;

namespace XStatic.Deploy
{
    public static class DeployerExtensions
    {
        public static IDeployServiceBuilder AddXStaticDeploy(this IServiceCollection services)
        {
            return new DeployServiceBuilder(services);
        }
    }
}