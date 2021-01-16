using NPoco;
using Umbraco.Core;
using Umbraco.Core.Composing;
using XStatic.Deploy;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Plugin.AutoPublish;
using XStatic.Plugin.Db;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin
{
    public class InstallerComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Register<IStaticSiteStorer, AppDataSiteStorer>();
            composition.Register<IImageCropNameGenerator, ImageCropNameGenerator>();
            composition.Register<IStaticHtmlSiteGenerator, StaticHtmlSiteGenerator>();
            composition.Register<IApiGenerator, JsonApiGenerator>();
            composition.Register<IDeployerFactory, DeployerFactory>();
            composition.Register<SitesRepository>();
            
            composition.Components().Append<XStaticDatabaseComponent>();
            composition.Components().Append<XStaticOnPublishAutoDeployComponent>();
        }
    }
}
