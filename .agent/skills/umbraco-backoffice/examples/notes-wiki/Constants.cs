namespace NotesWiki;

/// <summary>
/// Constants for the Notes Wiki extension.
/// </summary>
public static class Constants
{
    /// <summary>
    /// API name used for Swagger documentation grouping.
    /// </summary>
    public const string ApiName = "noteswiki";

    /// <summary>
    /// Entity type constants matching the TypeScript constants.
    /// These are used to identify different entity types in the tree.
    /// </summary>
    public static class EntityTypes
    {
        public const string Root = "notes-root";
        public const string Folder = "notes-folder";
        public const string Note = "notes-note";
    }
}
