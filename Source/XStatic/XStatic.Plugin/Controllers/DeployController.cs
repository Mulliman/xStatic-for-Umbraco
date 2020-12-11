using System.Threading.Tasks;
using System.Web.Http;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using XStatic.Deploy;
using XStatic.Generator.Storage;
using XStatic.Plugin.Processes;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class DeployController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerFactory _deployerFactory;
        private readonly SitesRepository _sitesRepo;

        public DeployController(IStaticSiteStorer storer, IDeployerFactory deployerFactory)
        {
            _storer = storer;
            _deployerFactory = deployerFactory;
            _sitesRepo = new SitesRepository();
        }

        [HttpGet]
        public async Task<string> DeployStaticSite(int staticSiteId)
        {
            var process = new DeployProcess(_storer, _deployerFactory, _sitesRepo);

            return await process.DeployStaticSite(staticSiteId);
        }
    }
}