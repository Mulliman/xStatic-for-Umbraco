using System.Text.Json;
using Microsoft.Extensions.Hosting;
using NotesWiki.Models;

namespace NotesWiki.Services;

/// <summary>
/// Implementation of INotesService using JSON file persistence.
/// Stores data in App_Data/NotesWiki/data.json
/// </summary>
public class NotesService : INotesService
{
    private readonly string _dataFilePath;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private NotesData _data = new();

    public NotesService(IHostEnvironment hostEnvironment)
    {
        var appDataPath = Path.Combine(hostEnvironment.ContentRootPath, "App_Data", "NotesWiki");
        Directory.CreateDirectory(appDataPath);
        _dataFilePath = Path.Combine(appDataPath, "data.json");

        // Load existing data or create with sample data
        LoadDataAsync().GetAwaiter().GetResult();
    }

    private async Task LoadDataAsync()
    {
        await _lock.WaitAsync();
        try
        {
            if (File.Exists(_dataFilePath))
            {
                var json = await File.ReadAllTextAsync(_dataFilePath);
                _data = JsonSerializer.Deserialize<NotesData>(json) ?? new NotesData();
            }
            else
            {
                // Create sample data
                _data = CreateSampleData();
                await SaveDataInternalAsync();
            }
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task SaveDataAsync()
    {
        await _lock.WaitAsync();
        try
        {
            await SaveDataInternalAsync();
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task SaveDataInternalAsync()
    {
        var json = JsonSerializer.Serialize(_data, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        await File.WriteAllTextAsync(_dataFilePath, json);
    }

    private NotesData CreateSampleData()
    {
        var data = new NotesData();

        // Create sample folders
        var gettingStartedFolder = new FolderModel
        {
            Unique = Guid.NewGuid(),
            Name = "Getting Started",
            ParentUnique = null,
            CreatedDate = DateTime.UtcNow
        };

        var projectNotesFolder = new FolderModel
        {
            Unique = Guid.NewGuid(),
            Name = "Project Notes",
            ParentUnique = null,
            CreatedDate = DateTime.UtcNow
        };

        data.Folders.Add(gettingStartedFolder);
        data.Folders.Add(projectNotesFolder);

        // Create sample notes
        data.Notes.Add(new NoteModel
        {
            Unique = Guid.NewGuid(),
            Title = "Welcome to Notes Wiki",
            Content = "This is your internal wiki for documentation and notes.\n\nUse folders to organize your content and tags to categorize notes.",
            ParentUnique = gettingStartedFolder.Unique,
            Tags = new List<string> { "welcome", "getting-started" },
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
            CreatedBy = "System",
            ModifiedBy = "System"
        });

        data.Notes.Add(new NoteModel
        {
            Unique = Guid.NewGuid(),
            Title = "How to Create Notes",
            Content = "1. Click the + button in the tree\n2. Select 'Create Note'\n3. Enter a title and content\n4. Add tags for organization\n5. Click Save",
            ParentUnique = gettingStartedFolder.Unique,
            Tags = new List<string> { "tutorial", "getting-started" },
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
            CreatedBy = "System",
            ModifiedBy = "System"
        });

        data.Notes.Add(new NoteModel
        {
            Unique = Guid.NewGuid(),
            Title = "Sample Project Note",
            Content = "This is a sample note in the Project Notes folder.\n\nReplace this with your actual project documentation.",
            ParentUnique = projectNotesFolder.Unique,
            Tags = new List<string> { "sample", "project" },
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
            CreatedBy = "System",
            ModifiedBy = "System"
        });

        return data;
    }

    // Tree operations
    public async Task<IEnumerable<TreeItemModel>> GetRootItemsAsync(int skip = 0, int take = 100)
    {
        await _lock.WaitAsync();
        try
        {
            var items = new List<TreeItemModel>();

            // Get root folders
            var rootFolders = _data.Folders
                .Where(f => f.ParentUnique == null)
                .OrderBy(f => f.Name)
                .Skip(skip)
                .Take(take);

            foreach (var folder in rootFolders)
            {
                items.Add(new TreeItemModel
                {
                    Id = folder.Unique.ToString(),
                    Name = folder.Name,
                    EntityType = Constants.EntityTypes.Folder,
                    HasChildren = HasChildren(folder.Unique),
                    IsFolder = true,
                    Icon = "icon-folder",
                    ParentId = null
                });
            }

            // Get root notes
            var rootNotes = _data.Notes
                .Where(n => n.ParentUnique == null)
                .OrderBy(n => n.Title)
                .Skip(Math.Max(0, skip - rootFolders.Count()))
                .Take(Math.Max(0, take - items.Count));

            foreach (var note in rootNotes)
            {
                items.Add(new TreeItemModel
                {
                    Id = note.Unique.ToString(),
                    Name = note.Title,
                    EntityType = Constants.EntityTypes.Note,
                    HasChildren = false,
                    IsFolder = false,
                    Icon = "icon-notepad",
                    ParentId = null
                });
            }

            return items;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<TreeItemModel>> GetChildrenAsync(Guid parentId, int skip = 0, int take = 100)
    {
        await _lock.WaitAsync();
        try
        {
            var items = new List<TreeItemModel>();

            // Get child folders
            var childFolders = _data.Folders
                .Where(f => f.ParentUnique == parentId)
                .OrderBy(f => f.Name);

            foreach (var folder in childFolders)
            {
                items.Add(new TreeItemModel
                {
                    Id = folder.Unique.ToString(),
                    Name = folder.Name,
                    EntityType = Constants.EntityTypes.Folder,
                    HasChildren = HasChildren(folder.Unique),
                    IsFolder = true,
                    Icon = "icon-folder",
                    ParentId = parentId.ToString()
                });
            }

            // Get child notes
            var childNotes = _data.Notes
                .Where(n => n.ParentUnique == parentId)
                .OrderBy(n => n.Title);

            foreach (var note in childNotes)
            {
                items.Add(new TreeItemModel
                {
                    Id = note.Unique.ToString(),
                    Name = note.Title,
                    EntityType = Constants.EntityTypes.Note,
                    HasChildren = false,
                    IsFolder = false,
                    Icon = "icon-notepad",
                    ParentId = parentId.ToString()
                });
            }

            return items.Skip(skip).Take(take);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<TreeItemModel>> GetAncestorsAsync(Guid id)
    {
        await _lock.WaitAsync();
        try
        {
            var ancestors = new List<TreeItemModel>();

            // Find the item
            var folder = _data.Folders.FirstOrDefault(f => f.Unique == id);
            var note = _data.Notes.FirstOrDefault(n => n.Unique == id);

            Guid? parentId = folder?.ParentUnique ?? note?.ParentUnique;

            while (parentId.HasValue)
            {
                var parentFolder = _data.Folders.FirstOrDefault(f => f.Unique == parentId.Value);
                if (parentFolder != null)
                {
                    ancestors.Insert(0, new TreeItemModel
                    {
                        Id = parentFolder.Unique.ToString(),
                        Name = parentFolder.Name,
                        EntityType = Constants.EntityTypes.Folder,
                        HasChildren = HasChildren(parentFolder.Unique),
                        IsFolder = true,
                        Icon = "icon-folder",
                        ParentId = parentFolder.ParentUnique?.ToString()
                    });
                    parentId = parentFolder.ParentUnique;
                }
                else
                {
                    break;
                }
            }

            return ancestors;
        }
        finally
        {
            _lock.Release();
        }
    }

    private bool HasChildren(Guid folderId)
    {
        return _data.Folders.Any(f => f.ParentUnique == folderId) ||
               _data.Notes.Any(n => n.ParentUnique == folderId);
    }

    // Note operations
    public async Task<NoteModel?> GetNoteAsync(Guid id)
    {
        await _lock.WaitAsync();
        try
        {
            return _data.Notes.FirstOrDefault(n => n.Unique == id);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<NoteModel> CreateNoteAsync(CreateNoteRequest request, string userName)
    {
        var note = new NoteModel
        {
            Unique = request.Unique,
            ParentUnique = request.ParentUnique,
            Title = request.Title,
            Content = request.Content,
            Tags = request.Tags,
            CreatedDate = DateTime.UtcNow,
            ModifiedDate = DateTime.UtcNow,
            CreatedBy = userName,
            ModifiedBy = userName
        };

        await _lock.WaitAsync();
        try
        {
            _data.Notes.Add(note);
            await SaveDataInternalAsync();
        }
        finally
        {
            _lock.Release();
        }

        return note;
    }

    public async Task<NoteModel?> UpdateNoteAsync(Guid id, UpdateNoteRequest request, string userName)
    {
        await _lock.WaitAsync();
        try
        {
            var note = _data.Notes.FirstOrDefault(n => n.Unique == id);
            if (note == null) return null;

            note.Title = request.Title;
            note.Content = request.Content;
            note.Tags = request.Tags;
            note.ModifiedDate = DateTime.UtcNow;
            note.ModifiedBy = userName;

            await SaveDataInternalAsync();
            return note;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteNoteAsync(Guid id)
    {
        await _lock.WaitAsync();
        try
        {
            var note = _data.Notes.FirstOrDefault(n => n.Unique == id);
            if (note == null) return false;

            _data.Notes.Remove(note);
            await SaveDataInternalAsync();
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<NoteModel>> GetRecentNotesAsync(int count = 10)
    {
        await _lock.WaitAsync();
        try
        {
            return _data.Notes
                .OrderByDescending(n => n.ModifiedDate)
                .Take(count);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<IEnumerable<NoteModel>> SearchNotesAsync(string query)
    {
        await _lock.WaitAsync();
        try
        {
            var searchTerm = query.ToLowerInvariant();
            return _data.Notes
                .Where(n =>
                    n.Title.ToLowerInvariant().Contains(searchTerm) ||
                    n.Content.ToLowerInvariant().Contains(searchTerm) ||
                    n.Tags.Any(t => t.ToLowerInvariant().Contains(searchTerm)))
                .OrderBy(n => n.Title);
        }
        finally
        {
            _lock.Release();
        }
    }

    // Folder operations
    public async Task<FolderModel?> GetFolderAsync(Guid id)
    {
        await _lock.WaitAsync();
        try
        {
            return _data.Folders.FirstOrDefault(f => f.Unique == id);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<FolderModel> CreateFolderAsync(CreateFolderRequest request)
    {
        var folder = new FolderModel
        {
            Unique = request.Unique,
            ParentUnique = request.ParentUnique,
            Name = request.Name,
            CreatedDate = DateTime.UtcNow
        };

        await _lock.WaitAsync();
        try
        {
            _data.Folders.Add(folder);
            await SaveDataInternalAsync();
        }
        finally
        {
            _lock.Release();
        }

        return folder;
    }

    public async Task<FolderModel?> UpdateFolderAsync(Guid id, UpdateFolderRequest request)
    {
        await _lock.WaitAsync();
        try
        {
            var folder = _data.Folders.FirstOrDefault(f => f.Unique == id);
            if (folder == null) return null;

            folder.Name = request.Name;
            await SaveDataInternalAsync();
            return folder;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteFolderAsync(Guid id)
    {
        await _lock.WaitAsync();
        try
        {
            var folder = _data.Folders.FirstOrDefault(f => f.Unique == id);
            if (folder == null) return false;

            // Check for children
            if (HasChildren(id))
            {
                return false; // Can't delete folder with children
            }

            _data.Folders.Remove(folder);
            await SaveDataInternalAsync();
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }
}

/// <summary>
/// Internal data structure for JSON persistence.
/// </summary>
internal class NotesData
{
    public List<NoteModel> Notes { get; set; } = new();
    public List<FolderModel> Folders { get; set; } = new();
}
