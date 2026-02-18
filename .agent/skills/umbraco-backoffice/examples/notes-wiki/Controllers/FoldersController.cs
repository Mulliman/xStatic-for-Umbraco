using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NotesWiki.Models;
using NotesWiki.Services;

namespace NotesWiki.Controllers;

/// <summary>
/// Controller for folder CRUD operations.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = Constants.ApiName)]
public class FoldersController : NotesApiControllerBase
{
    private readonly INotesService _notesService;

    public FoldersController(INotesService notesService)
    {
        _notesService = notesService;
    }

    /// <summary>
    /// Get a folder by ID.
    /// </summary>
    [HttpGet("folders/{id:guid}")]
    [ProducesResponseType(typeof(FolderModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FolderModel>> GetFolder(Guid id, CancellationToken token)
    {
        var folder = await _notesService.GetFolderAsync(id);
        if (folder == null)
        {
            return NotFound();
        }
        return Ok(folder);
    }

    /// <summary>
    /// Create a new folder.
    /// </summary>
    [HttpPost("folders")]
    [ProducesResponseType(typeof(FolderModel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<FolderModel>> CreateFolder(
        [FromBody] CreateFolderRequest request,
        CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        var folder = await _notesService.CreateFolderAsync(request);
        return CreatedAtAction(nameof(GetFolder), new { id = folder.Unique }, folder);
    }

    /// <summary>
    /// Update an existing folder (rename).
    /// </summary>
    [HttpPut("folders/{id:guid}")]
    [ProducesResponseType(typeof(FolderModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FolderModel>> UpdateFolder(
        Guid id,
        [FromBody] UpdateFolderRequest request,
        CancellationToken token)
    {
        var folder = await _notesService.UpdateFolderAsync(id, request);
        if (folder == null)
        {
            return NotFound();
        }
        return Ok(folder);
    }

    /// <summary>
    /// Delete a folder.
    /// </summary>
    [HttpDelete("folders/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> DeleteFolder(Guid id, CancellationToken token)
    {
        var success = await _notesService.DeleteFolderAsync(id);
        if (!success)
        {
            // Could be not found or has children
            return BadRequest("Folder not found or has children");
        }
        return NoContent();
    }
}
