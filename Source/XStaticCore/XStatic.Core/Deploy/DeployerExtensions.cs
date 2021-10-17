using Microsoft.Extensions.DependencyInjection;
using XStatic.Core.App;

namespace XStatic.Core.Deploy
{
    public static class DeployerExtensions
    {
        public static IDeployServiceBuilder AddXStaticDeploy(this IServiceCollection services)
        {
            return new DeployServiceBuilder(services);
        }
    }
}