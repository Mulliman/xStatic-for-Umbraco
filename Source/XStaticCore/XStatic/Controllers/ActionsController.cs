using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Controllers.Attributes;
using XStatic.Core.Actions;
using XStatic.Core.Actions.Db;
using XStatic.Core.Models;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [AuthorizeAdmin]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/actions")]
    public class ActionsController(IActionRepository repo) : Controller
    {
        private readonly IActionRepository _repo = repo;

        [HttpGet("get-post-actions")]
        [MapToApiVersion("1.0")]
        [EndpointName("Actions_GetPostActions")]
        [EndpointSummary("List post-generation actions")]
        [EndpointDescription("Returns all configured post-generation actions and their editable field values. Requires the xStaticAdmin role when xStatic roles are enabled.")]
        [ProducesResponseType(typeof(IEnumerable<ActionModel>), StatusCodes.Status200OK)]
        public IEnumerable<ActionModel> GetPostActions()
        {
            var actions = _repo.GetAllInCategory(ActionConstants.PostGenerationCategory);

            return actions.Select(a => new ActionModel(a));
        }

        [HttpPost("create-post-action")]
        [MapToApiVersion("1.0")]
        [EndpointName("Actions_CreatePostAction")]
        [EndpointSummary("Create a post-generation action")]
        [EndpointDescription("Creates a new configured post-generation action.")]
        [ProducesResponseType(typeof(ActionModel), StatusCodes.Status200OK)]
        public ActionModel CreatePostAction([FromBody] ActionUpdateModel model)
        {
            var dataModel = new ActionDataModel
            {
                Name = model.Name,
                Category = ActionConstants.PostGenerationCategory,
                Config = model.Config,
                Type = model.Type
            };

            var entity = _repo.Create(dataModel);

            return new ActionModel(entity);
        }

        [HttpPost("update-post-action")]
        [MapToApiVersion("1.0")]
        [EndpointName("Actions_UpdatePostAction")]
        [EndpointSummary("Update a post-generation action")]
        [EndpointDescription("Updates an existing configured post-generation action.")]
        [ProducesResponseType(typeof(ActionModel), StatusCodes.Status200OK)]
        public ActionModel UpdatePostAction([FromBody] ActionUpdateModel model)
        {
            var dataModel = new ActionDataModel
            {
                Id = model.Id,
                Name = model.Name,
                Category = ActionConstants.PostGenerationCategory,
                Config = model.Config,
                Type = model.Type
            };

            var entity = _repo.Update(dataModel);

            return new ActionModel(entity);
        }

        [HttpDelete("delete-post-action")]
        [MapToApiVersion("1.0")]
        [EndpointName("Actions_DeletePostAction")]
        [EndpointSummary("Delete a post-generation action")]
        [EndpointDescription("Deletes a configured post-generation action by ID.")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public void DeletePostAction(int id)
        {
            _repo.Delete(id);
        }
    }
}