using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NotesWiki.Models;
using NotesWiki.Services;

namespace NotesWiki.Controllers;

/// <summary>
/// Controller for note CRUD operations.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = Constants.ApiName)]
public class NotesController : NotesApiControllerBase
{
    private readonly INotesService _notesService;

    public NotesController(INotesService notesService)
    {
        _notesService = notesService;
    }

    /// <summary>
    /// Get a note by ID.
    /// </summary>
    [HttpGet("notes/{id:guid}")]
    [ProducesResponseType(typeof(NoteModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NoteModel>> GetNote(Guid id, CancellationToken token)
    {
        var note = await _notesService.GetNoteAsync(id);
        if (note == null)
        {
            return NotFound();
        }
        return Ok(note);
    }

    /// <summary>
    /// Create a new note.
    /// </summary>
    [HttpPost("notes")]
    [ProducesResponseType(typeof(NoteModel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<NoteModel>> CreateNote(
        [FromBody] CreateNoteRequest request,
        CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required");
        }

        var userName = User.Identity?.Name ?? "Unknown";
        var note = await _notesService.CreateNoteAsync(request, userName);
        return CreatedAtAction(nameof(GetNote), new { id = note.Unique }, note);
    }

    /// <summary>
    /// Update an existing note.
    /// </summary>
    [HttpPut("notes/{id:guid}")]
    [ProducesResponseType(typeof(NoteModel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<NoteModel>> UpdateNote(
        Guid id,
        [FromBody] UpdateNoteRequest request,
        CancellationToken token)
    {
        var userName = User.Identity?.Name ?? "Unknown";
        var note = await _notesService.UpdateNoteAsync(id, request, userName);
        if (note == null)
        {
            return NotFound();
        }
        return Ok(note);
    }

    /// <summary>
    /// Delete a note.
    /// </summary>
    [HttpDelete("notes/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteNote(Guid id, CancellationToken token)
    {
        var success = await _notesService.DeleteNoteAsync(id);
        if (!success)
        {
            return NotFound();
        }
        return NoContent();
    }

    /// <summary>
    /// Get recent notes.
    /// </summary>
    [HttpGet("notes/recent")]
    [ProducesResponseType(typeof(IEnumerable<NoteModel>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NoteModel>>> GetRecentNotes(
        CancellationToken token,
        [FromQuery] int count = 10)
    {
        var notes = await _notesService.GetRecentNotesAsync(count);
        return Ok(notes);
    }

    /// <summary>
    /// Search notes.
    /// </summary>
    [HttpGet("notes/search")]
    [ProducesResponseType(typeof(SearchResultsModel), StatusCodes.Status200OK)]
    public async Task<ActionResult<SearchResultsModel>> SearchNotes(
        [FromQuery] string q,
        CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new SearchResultsModel { Results = new List<NoteModel>(), TotalCount = 0 });
        }

        var results = await _notesService.SearchNotesAsync(q);
        return Ok(new SearchResultsModel
        {
            Results = results.ToList(),
            TotalCount = results.Count()
        });
    }
}

/// <summary>
/// Response model for search results.
/// </summary>
public class SearchResultsModel
{
    public List<NoteModel> Results { get; set; } = new();
    public int TotalCount { get; set; }
}
