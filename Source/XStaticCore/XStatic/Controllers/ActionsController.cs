using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Api.Management.Routing;
using XStatic.Core.Actions;
using XStatic.Core.Actions.Db;
using XStatic.Core.Models;

namespace XStatic.Controllers
{
    [VersionedApiBackOfficeRoute("xstatic/actions")]
    [ApiExplorerSettings(GroupName = "xStatic")]
    public class ActionsController(IActionRepository repo) : ManagementApiControllerBase
    {
        private readonly IActionRepository _repo = repo;

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IEnumerable<ActionModel> GetPostActions()
        {
            var actions = _repo.GetAllInCategory(ActionConstants.PostGenerationCategory);

            return actions.Select(a => new ActionModel(a));
        }

        [HttpPost]
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

        [HttpPost]
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

        [HttpDelete]
        public void DeletePostAction(int id)
        {
            _repo.Delete(id);
        }
    }
}