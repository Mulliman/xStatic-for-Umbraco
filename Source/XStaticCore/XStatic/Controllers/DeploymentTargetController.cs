using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using XStatic.Controllers.Attributes;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Models;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [AuthorizeAdmin]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/deployment-targets")]
    public class DeploymentTargetController : Controller
    {
        private readonly IDeploymentTargetRepository _repo;
        private readonly IDeployerService _service;
        private readonly IDeploymentTargetCreatorService _targetService;
        private readonly IEnumerable<IDeployerDefinition> _definitions;

        public DeploymentTargetController(IDeploymentTargetRepository repo,
            IDeployerService service,
            IDeploymentTargetCreatorService targetCreatorService)
        {
            _repo = repo;
            _service = service;
            _targetService = targetCreatorService;
            _definitions = _service.GetDefinitions();
        }

        [HttpGet("get-deployment-targets")]
        [MapToApiVersion("1.0")]
        [EndpointName("DeploymentTargets_GetAll")]
        [EndpointSummary("List deployment targets")]
        [EndpointDescription("Returns all configured deployment targets with their deployer definitions and field values. Requires the xStaticAdmin role when xStatic roles are enabled.")]
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

        public class AutoCreateDeploymentTargetResult : XStaticResult<DeploymentTargetModel>
        {
            public new static AutoCreateDeploymentTargetResult Success(DeploymentTargetModel data)
            {
                return new AutoCreateDeploymentTargetResult() { WasSuccessful = true, Data = data };
            }

            public new static AutoCreateDeploymentTargetResult Error(string message, Exception ex)
            {
                return new AutoCreateDeploymentTargetResult() { WasSuccessful = false, Message = message, Exception = ex };
            }
        }

        [HttpPost("auto-create-deployment-target")]
        [MapToApiVersion("1.0")]
        [EndpointName("DeploymentTargets_AutoCreate")]
        [EndpointSummary("Auto-create a deployment target")]
        [EndpointDescription("Provisions a remote deployment target using a registered IDeploymentTargetCreator and saves it to xStatic.")]
        [ProducesResponseType(typeof(AutoCreateDeploymentTargetResult), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(AutoCreateDeploymentTargetResult), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> AutoCreateDeploymentTarget([FromBody] DeploymentTargetCreatorPostModel model)
        {
            var creator = _targetService.GetDeploymentTargetCreator(model.Creator, model.Fields);

            try
            {
                var dataModel = await creator.CreateTarget();

                var createdModel = CreateDeploymentTarget(dataModel);

                return StatusCode((int)HttpStatusCode.Created, AutoCreateDeploymentTargetResult.Success(createdModel));
            }
            catch (XStaticException e)
            {
                return StatusCode((int)HttpStatusCode.Conflict, AutoCreateDeploymentTargetResult.Error(e.Message, e));
            }        
        }

        [HttpPost("create-deployment-target")]
        [MapToApiVersion("1.0")]
        [EndpointName("DeploymentTargets_Create")]
        [EndpointSummary("Create a deployment target")]
        [EndpointDescription("Creates a new deployment target configuration.")]
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
        [EndpointName("DeploymentTargets_Update")]
        [EndpointSummary("Update a deployment target")]
        [EndpointDescription("Updates an existing deployment target configuration.")]
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
        [EndpointName("DeploymentTargets_Delete")]
        [EndpointSummary("Delete a deployment target")]
        [EndpointDescription("Deletes a deployment target configuration by ID.")]
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