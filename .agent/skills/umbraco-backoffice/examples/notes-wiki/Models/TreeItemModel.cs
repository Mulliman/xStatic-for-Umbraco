using System.Text.Json.Serialization;

namespace NotesWiki.Models;

/// <summary>
/// Response model for tree items.
/// </summary>
public class TreeItemModel
{
    /// <summary>
    /// Unique identifier.
    /// </summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Display name.
    /// </summary>
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Entity type (notes-folder or notes-note).
    /// </summary>
    [JsonPropertyName("entityType")]
    public string EntityType { get; set; } = string.Empty;

    /// <summary>
    /// Whether this item has children.
    /// </summary>
    [JsonPropertyName("hasChildren")]
    public bool HasChildren { get; set; }

    /// <summary>
    /// Whether this is a folder.
    /// </summary>
    [JsonPropertyName("isFolder")]
    public bool IsFolder { get; set; }

    /// <summary>
    /// Icon to display.
    /// </summary>
    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "icon-notepad";

    /// <summary>
    /// Parent ID (null for root items).
    /// </summary>
    [JsonPropertyName("parentId")]
    public string? ParentId { get; set; }
}
