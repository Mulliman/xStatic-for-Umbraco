using NotesWiki.Models;

namespace NotesWiki.Services;

/// <summary>
/// Service interface for Notes Wiki data operations.
/// </summary>
public interface INotesService
{
    // Tree operations
    Task<IEnumerable<TreeItemModel>> GetRootItemsAsync(int skip = 0, int take = 100);
    Task<IEnumerable<TreeItemModel>> GetChildrenAsync(Guid parentId, int skip = 0, int take = 100);
    Task<IEnumerable<TreeItemModel>> GetAncestorsAsync(Guid id);

    // Note operations
    Task<NoteModel?> GetNoteAsync(Guid id);
    Task<NoteModel> CreateNoteAsync(CreateNoteRequest request, string userName);
    Task<NoteModel?> UpdateNoteAsync(Guid id, UpdateNoteRequest request, string userName);
    Task<bool> DeleteNoteAsync(Guid id);
    Task<IEnumerable<NoteModel>> GetRecentNotesAsync(int count = 10);
    Task<IEnumerable<NoteModel>> SearchNotesAsync(string query);

    // Folder operations
    Task<FolderModel?> GetFolderAsync(Guid id);
    Task<FolderModel> CreateFolderAsync(CreateFolderRequest request);
    Task<FolderModel?> UpdateFolderAsync(Guid id, UpdateFolderRequest request);
    Task<bool> DeleteFolderAsync(Guid id);
}
