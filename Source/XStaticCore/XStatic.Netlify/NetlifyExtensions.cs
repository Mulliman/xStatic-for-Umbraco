using XStatic.Deploy.Configuration;

namespace XStatic.Netlify
{
    public static class NetlifyExtensions
    {
        public static IDeployConfigurationBuilder AddNetlifyDeployer(this IDeployConfigurationBuilder builder)
        {
            builder.AddDeployer(new NetlifyDeployerDefinition(), (x) => new NetlifyDeployer(x));

            return builder;
        }
    }
}