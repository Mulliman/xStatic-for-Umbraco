using Asp.Versioning;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Api.Management.ViewModels.Tree;

namespace UmbTreeClient.Controllers.Tree;

[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = "UmbTreeClient")]
public class OurTreeController : UmbTreeClientApiControllerBase
{
    [HttpGet("root")]
    [ProducesResponseType(typeof(PagedViewModel<OurTreeItemResponseModel>), StatusCodes.Status200OK)]
    public ActionResult<PagedViewModel<OurTreeItemResponseModel>> GetRoot(CancellationToken token, int skip = 0, int take = 100, bool foldersOnly = false)
    {
        var items = new List<OurTreeItemResponseModel>();
        for (int n = 0; n < 5; n++)
        {
            items.Add(new OurTreeItemResponseModel
            {
                Id = Guid.NewGuid(),
                Name = $"Item {n + 1}",
                Icon = "icon-star",
                HasChildren = true,
            });
        }

        return Ok(new PagedViewModel<OurTreeItemResponseModel>
        {
            Items = items,
            Total = items.Count
        });
    }

    [HttpGet("Children")]
    [ProducesResponseType(typeof(PagedViewModel<OurTreeItemResponseModel>), statusCode: StatusCodes.Status200OK)]
    public ActionResult<PagedViewModel<OurTreeItemResponseModel>> GetChildren(string parent, int skip = 0, int take = 100)
    {
        var items = new List<OurTreeItemResponseModel>();
        for (int n = 0; n < 5; n++)
        {
            items.Add(new OurTreeItemResponseModel
            {
                Id = Guid.NewGuid(),
                Name = $"Child Item {n + 1} of {parent}",
                Icon = "icon-star",
                HasChildren = false,
            });
        }
        return Ok(new PagedViewModel<OurTreeItemResponseModel>
        {
            Items = items,
            Total = items.Count
        });
    }

    [HttpGet("Ancestors")]
    [ProducesResponseType(typeof(IEnumerable<OurTreeItemResponseModel>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OurTreeItemResponseModel>>> GetAncestors(string id)
        => await Task.FromResult(Ok(Enumerable.Empty<OurTreeItemResponseModel>()));
}


public class  OurTreeItemResponseModel : NamedEntityTreeItemResponseModel
{
    public string Icon { get; set; } = "icon-star";
}
