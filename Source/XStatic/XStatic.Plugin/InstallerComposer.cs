using Umbraco.Core;
using Umbraco.Core.Composing;
using XStatic.Deploy;
using XStatic.Generator;
using XStatic.Generator.Storage;

namespace XStatic.Plugin
{
    public class InstallerComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Register<IStaticSiteStorer, AppDataSiteStorer>();
            composition.Register<IStaticHtmlSiteGenerator, StaticHtmlSiteGenerator>();
            composition.Register<IApiGenerator, JsonApiGenerator>();
            composition.Register<IDeployerFactory, DeployerFactory>();
        }
    }
}
