using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NotesWiki.Models;
using NotesWiki.Services;

namespace NotesWiki.Controllers;

/// <summary>
/// Controller for tree navigation endpoints.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = Constants.ApiName)]
public class NotesTreeController : NotesApiControllerBase
{
    private readonly INotesService _notesService;

    public NotesTreeController(INotesService notesService)
    {
        _notesService = notesService;
    }

    /// <summary>
    /// Get root tree items.
    /// </summary>
    [HttpGet("tree/root")]
    [ProducesResponseType(typeof(TreeResponseModel), StatusCodes.Status200OK)]
    public async Task<ActionResult<TreeResponseModel>> GetRoot(
        CancellationToken token,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var items = await _notesService.GetRootItemsAsync(skip, take);
        return Ok(new TreeResponseModel
        {
            Items = items.ToList(),
            Total = items.Count()
        });
    }

    /// <summary>
    /// Get children of a tree item.
    /// </summary>
    [HttpGet("tree/children/{parentId:guid}")]
    [ProducesResponseType(typeof(TreeResponseModel), StatusCodes.Status200OK)]
    public async Task<ActionResult<TreeResponseModel>> GetChildren(
        Guid parentId,
        CancellationToken token,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 100)
    {
        var items = await _notesService.GetChildrenAsync(parentId, skip, take);
        return Ok(new TreeResponseModel
        {
            Items = items.ToList(),
            Total = items.Count()
        });
    }

    /// <summary>
    /// Get ancestors of a tree item (for breadcrumb navigation).
    /// </summary>
    [HttpGet("tree/ancestors/{id:guid}")]
    [ProducesResponseType(typeof(IEnumerable<TreeItemModel>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TreeItemModel>>> GetAncestors(
        Guid id,
        CancellationToken token)
    {
        var ancestors = await _notesService.GetAncestorsAsync(id);
        return Ok(ancestors);
    }
}

/// <summary>
/// Response model for tree endpoints.
/// </summary>
public class TreeResponseModel
{
    public List<TreeItemModel> Items { get; set; } = new();
    public int Total { get; set; }
}
