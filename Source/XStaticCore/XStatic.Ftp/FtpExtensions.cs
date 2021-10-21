using XStatic.Core.App;

namespace XStatic.Ftp
{
    public static class FtpExtensions
    {
        public static IDeployServiceBuilder AddGitDeployer(this IDeployServiceBuilder builder)
        {
            builder.AddDeployer(new FtpDeployerDefinition(), (x) => new FtpDeployer(x));

            return builder;
        }
    }
}