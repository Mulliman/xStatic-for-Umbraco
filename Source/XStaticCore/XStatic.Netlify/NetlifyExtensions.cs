using XStatic.Core.App;

namespace XStatic.Netlify
{
    public static class NetlifyExtensions
    {
        public static IDeployServiceBuilder AddNetlifyDeployer(this IDeployServiceBuilder builder)
        {
            builder.AddDeployer(new NetlifyDeployerDefinition(), (x) => new NetlifyDeployer(x));

            return builder;
        }
    }
}