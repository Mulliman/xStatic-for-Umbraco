using System.Text.Json.Serialization;

namespace NotesWiki.Models;

/// <summary>
/// Represents a folder containing notes.
/// </summary>
public class FolderModel
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
    public string EntityType { get; set; } = Constants.EntityTypes.Folder;

    /// <summary>
    /// Parent folder ID, or null if at root.
    /// </summary>
    [JsonPropertyName("parentUnique")]
    public Guid? ParentUnique { get; set; }

    /// <summary>
    /// Folder name.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// When the folder was created.
    /// </summary>
    [JsonPropertyName("createdDate")]
    public DateTime CreatedDate { get; set; }
}

/// <summary>
/// Request model for creating a folder.
/// </summary>
public class CreateFolderRequest
{
    [JsonPropertyName("unique")]
    public Guid Unique { get; set; }

    [JsonPropertyName("parentUnique")]
    public Guid? ParentUnique { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// Request model for updating a folder.
/// </summary>
public class UpdateFolderRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}
