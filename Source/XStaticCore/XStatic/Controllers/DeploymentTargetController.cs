using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Models;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/deployment-targets")]
    public class DeploymentTargetController : Controller
    {
        private readonly IDeploymentTargetRepository _repo;
        private readonly IDeployerService _service;
        private readonly IEnumerable<IDeployerDefinition> _definitions;

        public DeploymentTargetController(IDeploymentTargetRepository repo, IDeployerService service)
        {
            _repo = repo;
            _service = service;

            _definitions = _service.GetDefinitions();
        }

        [HttpGet("get-deployment-targets")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(IEnumerable<DeploymentTargetModel>), StatusCodes.Status200OK)]
        public IEnumerable<DeploymentTargetModel> GetDeploymentTargets()
        {
            var deploymentTargets = _repo.GetAll();

            foreach ( var dt in deploymentTargets) 
            { 
                var mapped = MapDeploymentTargetModel(dt);

                if(mapped != null)
                {
                    yield return mapped;
                }   
            }
        }

        [HttpPost("create-deployment-target")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(DeploymentTargetModel), StatusCodes.Status200OK)]
        public DeploymentTargetModel CreateDeploymentTarget([FromBody] DeploymentTargetUpdateModel model)
        {
            var dataModel = new DeploymentTargetDataModel
            {
                Name = model.Name,
                DeployerDefinition = model.DeployerDefinition,
                Config = model.Fields
            };

            var entity = _repo.Create(dataModel);

            return MapDeploymentTargetModel(entity);
        }

        [HttpPost("update-deployment-target")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(DeploymentTargetModel), StatusCodes.Status200OK)]
        public DeploymentTargetModel UpdateDeploymentTarget([FromBody] DeploymentTargetUpdateModel model)
        {
            var dataModel = new DeploymentTargetDataModel
            {
                Id = model.Id,
                Name = model.Name,
                DeployerDefinition = model.DeployerDefinition,
                Config = model.Fields
            };

            var entity = _repo.Update(dataModel);

            return MapDeploymentTargetModel(entity);
        }

        [HttpDelete("delete-deployment-target")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public void DeleteDeploymentTarget(int id)
        {
            _repo.Delete(id);
        }

        private DeploymentTargetModel MapDeploymentTargetModel(DeploymentTargetDataModel dataModel)
        {
            var match = _definitions.FirstOrDefault(d => d.Id == dataModel.DeployerDefinition);

            if (match != null)
            {
                return new DeploymentTargetModel(dataModel, match);
            }

            return null;
        }
    }
}