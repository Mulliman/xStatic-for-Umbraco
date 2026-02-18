using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TimeDashboard.Controllers.Tree.Models;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Api.Management.ViewModels;

namespace TimeDashboard.Controllers.Tree
{
    [ApiVersion("1.0")]
    public class TimeTreeChildrenController : TimeTreeControllerBase
    {
        [HttpGet]
        [MapToApiVersion("1.0")]
        [ProducesResponseType<PagedViewModel<TimeTreeItemResponseModel>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedViewModel<TimeTreeItemResponseModel>>> GetChildren(
            Guid parentId,
            int skip = 0,
            int take = 100)
        {
            var items = GetChildrenForParent(parentId).ToList();
            return Ok(PagedViewModel(items, items.Count));
        }

        private IEnumerable<TimeTreeItemResponseModel> GetChildrenForParent(Guid? parentId)
        {
            yield return new TimeTreeItemResponseModel
            {
                Id = Guid.NewGuid(),
                HasChildren = false,
                Name = "Child item",
                Parent = parentId.HasValue
                    ? new ReferenceByIdModel { Id = parentId.Value }
                    : null
            };
        }
    }
}
