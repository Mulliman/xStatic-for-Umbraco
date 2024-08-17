using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Controllers.Attributes;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [AuthorizeNormalUser]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/deploy")]
    public class DeployController(IStaticSiteStorer storer, IDeployerService deployerService, IDeploymentTargetRepository deplomentTargetRepository, ISitesRepository sitesRepository, ILogger<DeployController> logger) : ManagementApiControllerBase
    {
        private readonly IStaticSiteStorer _storer = storer;
        private readonly IDeployerService _deployerService = deployerService;
        private readonly IDeploymentTargetRepository _deplomentTargetRepository = deplomentTargetRepository;
        private readonly ISitesRepository _sitesRepo = sitesRepository;
        private readonly ILogger<DeployController> _logger = logger;

        [HttpPost("deploy-site")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(IXStaticWebResult), StatusCodes.Status200OK)]
        public async Task<IXStaticWebResult> DeployStaticSite(int staticSiteId)
        {
            var process = new DeployProcess(_storer, _deplomentTargetRepository, _deployerService, _sitesRepo);

            var result = await process.DeployStaticSite(staticSiteId);

            if (!result.WasSuccessful)
            {
                _logger.LogError(result.Exception, result.Message);
            }

            return result;
        }
    }
}