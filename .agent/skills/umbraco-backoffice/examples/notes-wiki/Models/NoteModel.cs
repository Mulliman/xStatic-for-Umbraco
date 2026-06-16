using System.Text.Json.Serialization;

namespace NotesWiki.Models;

/// <summary>
/// Represents a note in the wiki.
/// </summary>
public class NoteModel
{
    /// <summary>
    /// Unique identifier (GUID).
    /// </summary>
    [JsonPropertyName("unique")]
    public Guid Unique { get; set; }

    /// <summary>
    /// Entity type identifier.
    /// </summary>
    [JsonPropertyName("entityType")]
    public string EntityType { get; set; } = Constants.EntityTypes.Note;

    /// <summary>
    /// Parent folder ID, or null if at root.
    /// </summary>
    [JsonPropertyName("parentUnique")]
    public Guid? ParentUnique { get; set; }

    /// <summary>
    /// Note title.
    /// </summary>
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Note content (rich text/markdown).
    /// </summary>
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Tags for categorization.
    /// </summary>
    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();

    /// <summary>
    /// When the note was created.
    /// </summary>
    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }

    /// <summary>
    /// When the note was last modified.
    /// </summary>
    [JsonPropertyName("modifiedDate")]
    public DateTime ModifiedDate { get; set; }

    /// <summary>
    /// Who created the note.
    /// </summary>
    [JsonPropertyName("createdBy")]
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// Who last modified the note.
    /// </summary>
    [JsonPropertyName("modifiedBy")]
    public string ModifiedBy { get; set; } = string.Empty;
}

/// <summary>
/// Request model for creating a note.
/// </summary>
public class CreateNoteRequest
{
    [JsonPropertyName("unique")]
    public Guid Unique { get; set; }

    [JsonPropertyName("parentUnique")]
    public Guid? ParentUnique { get; set; }

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}

/// <summary>
/// Request model for updating a note.
/// </summary>
public class UpdateNoteRequest
{
    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}
