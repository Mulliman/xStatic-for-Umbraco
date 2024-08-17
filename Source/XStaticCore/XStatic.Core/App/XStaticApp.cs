using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Services;

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

        /// <summary>
        /// This adds two roles and turns on secure user groups so that only specified users can access private data like API keys.
        /// </summary>
        /// <param name="adminUserToCreateRoles">This is likely to be the email of the user</param>
        /// <returns></returns>
        public XStaticServiceBuilder UseSecureUserGroups(string adminUserToCreateRoles)
        {
            _services.Configure<XStaticGlobalSettings>(settings =>
            {
                settings.UseXStaticUserRoles = true;
                settings.RoleCreationUser = adminUserToCreateRoles;
            });

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