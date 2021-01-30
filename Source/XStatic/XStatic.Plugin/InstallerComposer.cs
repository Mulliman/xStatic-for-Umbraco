using NPoco;
using Umbraco.Core;
using Umbraco.Core.Composing;
using XStatic.Deploy;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Plugin.AutoPublish;
using XStatic.Plugin.Db;
using XStatic.Plugin.Repositories;
using XStatic.Plugin.ExportType;
using XStatic.Plugin.Deploy;

namespace XStatic.Plugin
{
    public class InstallerComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Register<IStaticSiteStorer, AppDataSiteStorer>();
            composition.Register<IImageCropNameGenerator, ImageCropNameGenerator>();

            composition.Register<StaticHtmlSiteGenerator>();
            composition.Register<JsonApiGenerator>();

            composition.Register<IDeployerFactory, AppPluginsJsonDeployerFactory>();
            composition.Register<IExportTypeSettings, AppPluginsJsonExportTypeSettings>();
            composition.Register<SitesRepository>();
            
            composition.Components().Append<XStaticDatabaseComponent>();
            composition.Components().Append<XStaticOnPublishAutoDeployComponent>();
        }
    }
}
