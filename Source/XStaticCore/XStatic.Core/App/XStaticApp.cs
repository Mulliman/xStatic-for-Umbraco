using System.Collections.Generic;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using Umbraco.Cms.Core.Services;
using XStatic.Core.Generator.Storage;

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
			DeployServiceBuilder.AddDeploymentTargetCreatorsAutomatically();

			return this;
		}

		/// <summary>
		/// When used, it will add the <see cref="CustomDefinedSingleSiteStorer"/>, which provides custom output folder
		/// naming. It also removes the default <see cref="AppDataSiteStorer"/>.
		/// </summary>
		/// <returns></returns>
		public XStaticServiceBuilder AutomaticWithSingleSiteOutput(string outputFolderName = "DefaultOutputFolder")
		{
			GeneratorServiceBuilder.AddSingleSiteDefaults(outputFolderName);
			DeployServiceBuilder.AddDeployersAutomatically();
			DeployServiceBuilder.AddDeploymentTargetCreatorsAutomatically();

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

		/// <summary>
		/// This adds two roles and turns on secure user groups so that only specified users can access private data like API keys.
		/// This will use the root user to create the roles and will assign the xStatic roles to that root user.
		/// </summary>
		/// <returns></returns>
		public XStaticServiceBuilder UseSecureUserGroups()
		{
			_services.Configure<XStaticGlobalSettings>(settings =>
			{
				settings.UseXStaticUserRoles = true;
				settings.RoleCreationUseRootUser = true;
			});

			return this;
		}

		/// <summary>
		/// When set to true, this will trust SSL certificates when generating static files even if the certificate chain isn't perfectly set up.
		/// This is needed on Linux when using dotnet CLI to create the site.
		/// </summary>
		/// <returns></returns>
		public XStaticServiceBuilder TrustUnsafeSslConnectionWhenGenerating()
		{
			_services.Configure<XStaticGlobalSettings>(settings =>
			{
				settings.TrustSslWhenGenerating = true;
			});

			return this;
		}

		/// <summary>
		/// Files and folders to keep when a site's stored output is cleared, for example ".git" or "CNAME".
		/// These replace the defaults (".git" and "CNAME"). The same setting can be made in appsettings.json as XStatic:DoNotDeletePaths.
		/// </summary>
		public XStaticServiceBuilder DoNotDeletePathsWhenClearing(params string[] paths)
		{
			_services.Configure<XStaticGlobalSettings>(settings =>
			{
				settings.DoNotDeletePaths = paths?.ToList() ?? new List<string>();
			});

			return this;
		}

		/// <summary>
		/// When a list of DocType aliases is provided, these will be excluded from the generation process.
		/// </summary>
		/// <param name="DocTypeAliasToExclude"></param>
		/// <returns></returns>
		public XStaticServiceBuilder ExcludeGeneratingDocTypes(IList<string> DocTypeAliasToExclude)
		{
			_services.Configure<XStaticGlobalSettings>(settings =>
			{
				settings.ExcludeGeneratingDocTypes = DocTypeAliasToExclude;
			});

			return this;
		}

		/// <summary>
		/// Registers an additional <see cref="XStatic.Core.AutoPublish.IAutoPublishSiteResolver"/> for resolving
		/// affected static sites during auto-publish (for example, custom Umbraco 18/19 Library or Element dependency graphs).
		/// </summary>
		public XStaticServiceBuilder AddAutoPublishSiteResolver<TResolver>()
			where TResolver : class, XStatic.Core.AutoPublish.IAutoPublishSiteResolver
		{
			GeneratorServiceBuilder.AddAutoPublishSiteResolver<TResolver>();

			return this;
		}

		/// <summary>
		/// Configures content type aliases whose publication should trigger auto-publish across all auto-publish enabled sites.
		/// </summary>
		public XStaticServiceBuilder AutoPublishGlobalContentTypes(IList<string> contentTypeAliases)
		{
			_services.Configure<XStaticGlobalSettings>(settings =>
			{
				settings.AutoPublishGlobalContentTypes = contentTypeAliases;
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
			services.AddOptions<XStaticGlobalSettings>().BindConfiguration("XStatic");
			return new XStaticServiceBuilder(services);
		}
	}
}
