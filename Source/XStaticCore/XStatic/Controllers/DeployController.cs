using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [PluginController("xstatic")]
    public class DeployController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerService _deployerService;
        private readonly ISitesRepository _sitesRepo;
        private readonly ILogger<DeployController> _logger;

        public DeployController(IStaticSiteStorer storer, IDeployerService deployerService, ISitesRepository sitesRepository, ILogger<DeployController> logger)
        {
            _storer = storer;
            _deployerService = deployerService;
            _sitesRepo = sitesRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IXStaticWebResult> DeployStaticSite(int staticSiteId)
        {
            var process = new DeployProcess(_storer, _deployerService, _sitesRepo);

            var result = await process.DeployStaticSite(staticSiteId);

            if (!result.WasSuccessful)
            {
                _logger.LogError(result.Exception, result.Message);
            }

            return result;
        }
    }
}