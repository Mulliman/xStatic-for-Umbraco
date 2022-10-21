using XStatic.Core.App;

namespace XStatic.Ftp
{
    public static class FtpExtensions
    {
        public static IDeployServiceBuilder AddFtpDeployer(this IDeployServiceBuilder builder)
        {
            builder.AddDeployer(new FtpDeployerDefinition(), (x) => new FtpDeployer(x));

            return builder;
        }
    }
}