Where xStatic keeps the files it generates before they are deployed, and how to change that. A site storer writes the generated files into a staging folder. The deployers, the **Download** button and the **Clean** button all read that folder. This page is for developers.

## At a glance

- By default each site is written to `umbraco/Data/xStatic/output/<siteId>` under the site's content root.
- To write everything to one fixed folder name (handy for a Git checkout), use `AutomaticWithSingleSiteOutput`.
- To write somewhere else entirely, implement `IStaticSiteStorer` and register it.
- A generate never empties the folder. Use **Clean** (or the clear endpoint) for that. Some paths, such as `.git` and `CNAME`, survive it.

## The storer interface

```csharp
public interface IStaticSiteStorer
{
    string GetStorageLocationOfSite(int staticSiteId);
    Task<string> StoreSiteItem(string staticSiteId, string path, string contents, System.Text.Encoding encoding);
    Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath);
    Task<string> SaveFile(string subFolder, Stream stream, string partialDestinationPath);
    Task DeleteFile(string sourcePath);
    string GetFileDestinationPath(string subFolder, string partialDestinationPath);
    Task<string> MoveFile(string subFolder, string sourcePath, string partialDestinationPath);
}
```

It is in the `XStatic.Core.Generator.Storage` namespace ([IStaticSiteStorer.cs](../Source/XStaticCore/XStatic.Core/Generator/Storage/IStaticSiteStorer.cs)).

| Member | What it must do |
|--------|-----------------|
| `GetStorageLocationOfSite` | Return the folder that holds the site's finished output. See the note below |
| `StoreSiteItem` | Write text (a page) to `path` inside the site's folder, with the given encoding. Return the location it wrote |
| `CopyFile` | Copy a file from an absolute `sourcePath` to `partialDestinationPath` inside the site's folder. Return the destination |
| `SaveFile` | Write a stream to `partialDestinationPath`. Return the destination |
| `DeleteFile` | Delete the file at an absolute path |
| `GetFileDestinationPath` | Return the absolute path a file will have, after clearing the way for it: any existing file there is deleted and its folders are created. The generator writes crops straight to this path |
| `MoveFile` | Move a file to `partialDestinationPath`. Return the destination |

The `subFolder` and `staticSiteId` arguments are always the site's id as a string. The generator passes it on every call.

**The output must be a real folder on a local disk.** Several parts of xStatic read the location from `GetStorageLocationOfSite` and then work on the disk directly:

- `DeployProcess` hands the path to the deployer, which reads the files.
- **Download** zips the folder into a file next to it (the folder path plus `.zip`).
- **Clean** deletes the contents of the folder.
- The site list works out the folder size from it.
- Post-generation actions find files relative to it.

So a custom storer can choose any local path (a network share is fine), but it can't write to something that has no folder, such as a blob container, unless it also keeps a local copy.

## The default: AppDataSiteStorer

[`AppDataSiteStorer`](../Source/XStaticCore/XStatic.Core/Generator/Storage/AppDataSiteStorer.cs) is registered by `Automatic()` and by the composer's default setup. It writes to:

```text
<content root>/umbraco/Data/xStatic/output/<siteId>/
```

For a site with id `3`, a page with the URL `/about/` is stored as `umbraco/Data/xStatic/output/3/about/index.html`. The `<content root>` is `IWebHostEnvironment.ContentRootPath`, which is the folder holding the Umbraco project. The `xStatic` and `output` folders are created the first time the storer is created, and a site's own folder is created the first time something is written to it.

Each write deletes any existing file at the target first, then creates the folders it needs. The folder is not under `App_Data`. Older documentation and versions refer to `App_Data`, but the current code uses `umbraco/Data`.

Paths are joined through `FileHelpers.PathCombine`, which strips leading slashes, so a path starting with `/` stays inside the site's folder.

## Single-site output

[`CustomDefinedSingleSiteStorer`](../Source/XStaticCore/XStatic.Core/Generator/Storage/CustomDefinedSingleSiteStorer.cs) writes to one folder with a name you choose, and ignores the site id:

```text
<content root>/umbraco/Data/xStatic/output/<outputFolderName>/
```

With `outputFolderName` set to `my-site`, the `/about/` page goes to `umbraco/Data/xStatic/output/my-site/about/index.html`. There is no per-site subfolder. That gives you a stable, predictable folder, which is useful when another tool works on it (a Git working copy, a CI job, a sync).

Turn it on by opting out of the default setup and calling `AutomaticWithSingleSiteOutput`. The name defaults to `DefaultOutputFolder`:

```csharp
using XStatic.Core.App;

builder.Services.AddXStatic()
    .AutomaticWithSingleSiteOutput("my-site")
    .UseSecureUserGroups()
    .Build();
```

Do this before Umbraco's composers run (before `AddComposers()` in `Program.cs`). See [Extending-xStatic.md](Extending-xStatic.md#opting-out-of-the-default-setup) for why, and for the other builder methods. If you assemble the services yourself, `GeneratorServiceBuilder.AddSingleSiteStorageServices("my-site")` registers just the storer, and `AddSingleSiteDefaults("my-site")` registers all the generator defaults with it.

Know the limits:

- If you have more than one site, they all write into the same folder and overwrite each other. Use it for one site.
- Its `SaveFile` always rewinds the stream, so a stream that can't seek will throw. The default storer checks first. The generator's own media copying uses seekable streams.
- **Download** creates `my-site.zip` beside the folder, inside `output`.

## Clearing the output folder

A generate never clears the folder. It overwrites each file it writes and leaves everything else, so pages you have since deleted, and old crops, stay in the output and are deployed. Clearing is a separate action.

In the backoffice, click **Clean** on a site. It only shows once a site has been generated and the folder isn't empty. A dialog (**Clean Up Site**) asks you to confirm, and warns that you must generate again before you can deploy. Over the API, it is `DELETE api/v1/xstatic/sites/clear-stored-site?staticSiteId=N` (see [Management-API.md](Management-API.md)). Both do the same thing: take the folder from the storer's `GetStorageLocationOfSite` and delete its contents, except the do-not-delete paths.

### DoNotDeletePaths

Some things in the output folder should survive a clean: the `.git` folder of a Git deployment, a `CNAME` file for GitHub Pages, a hand-made `_headers` file.

- The defaults are `.git` and `CNAME`.
- Set your own list in `appsettings.json` as `XStatic:DoNotDeletePaths`, or with `DoNotDeletePathsWhenClearing(...)` in code. Your list **replaces** the defaults, unless it is empty (or only blanks), in which case the defaults are used. Include `.git` and `CNAME` in it if you still want them kept.
- Only the top level of the folder is looked at. Each file or folder directly inside it is kept if its full path ends with one of the entries (ignoring case). A kept folder keeps everything inside it.
- Because it matches the end of the path, `CNAME` also keeps a file called `xCNAME`. Use distinctive names.
- Anything else at the top level is deleted, folders included.

```json
{
  "XStatic": {
    "DoNotDeletePaths": [ ".git", "CNAME", "_headers" ]
  }
}
```

```csharp
using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .DoNotDeletePathsWhenClearing(".git", "CNAME", "_headers")
    .Build();
```

See [Configuration.md](Configuration.md) for all the settings.

## Writing a custom storer

Use this when the files must go somewhere other than `umbraco/Data/xStatic/output`. This example writes to a folder you give it, with one subfolder per site:

```csharp
using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;

namespace MySite.Export;

public class ConfiguredFolderStorer : IStaticSiteStorer
{
    private readonly string _root;

    public ConfiguredFolderStorer(string rootFolder)
    {
        _root = Path.GetFullPath(rootFolder);
        Directory.CreateDirectory(_root);
    }

    public string GetStorageLocationOfSite(int staticSiteId)
    {
        return Path.Combine(_root, staticSiteId.ToString());
    }

    public async Task<string> StoreSiteItem(string staticSiteId, string path, string contents, Encoding encoding)
    {
        var destination = GetFileDestinationPath(staticSiteId, path);
        await File.WriteAllTextAsync(destination, contents, encoding);

        return destination;
    }

    public Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath)
    {
        var destination = GetFileDestinationPath(subFolder, partialDestinationPath);
        File.Copy(sourcePath, destination);

        return Task.FromResult(destination);
    }

    public async Task<string> SaveFile(string subFolder, Stream stream, string partialDestinationPath)
    {
        var destination = GetFileDestinationPath(subFolder, partialDestinationPath);

        await using var file = File.Create(destination);

        if (stream.CanSeek)
        {
            stream.Seek(0, SeekOrigin.Begin);
        }

        await stream.CopyToAsync(file);

        return destination;
    }

    public Task DeleteFile(string sourcePath)
    {
        File.Delete(sourcePath);

        return Task.CompletedTask;
    }

    public Task<string> MoveFile(string subFolder, string sourcePath, string partialDestinationPath)
    {
        var destination = GetFileDestinationPath(subFolder, partialDestinationPath);
        File.Move(sourcePath, destination);

        return Task.FromResult(destination);
    }

    public string GetFileDestinationPath(string subFolder, string partialDestinationPath)
    {
        var relative = FileHelpers.PathCombine(subFolder, partialDestinationPath);
        var destination = Path.GetFullPath(Path.Combine(_root, relative));

        // Stay inside the root, even if a path contains "..".
        var rootWithSeparator = _root.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        if (!destination.StartsWith(rootWithSeparator, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"'{partialDestinationPath}' is outside the output folder.");
        }

        Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
        File.Delete(destination); // does nothing when the file doesn't exist

        return destination;
    }
}
```

`GetFileDestinationPath` does the shared work (stay inside the root, create folders, delete any old file), and every other method uses it, as the built-in storers do.

### Register it

You need your storer to be the only `IStaticSiteStorer`, or at least the last one registered. There are two ways.

**Keep xStatic's default setup and override the storer.** Add a composer that runs after xStatic's:

```csharp
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using XStatic.Core.Generator.Storage;

namespace MySite.Export;

[ComposeAfter(typeof(XStatic.XStaticComposer))]
public class StorerComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<IStaticSiteStorer>(new ConfiguredFolderStorer(@"D:\static-output"));
    }
}
```

**Opt out and assemble the services yourself**, leaving out the default storer. Call the separate builder methods rather than `Automatic()`:

```csharp
using XStatic.Core.App;
using XStatic.Core.Generator.Storage;

var xStatic = builder.Services.AddXStatic();

xStatic.GeneratorServiceBuilder
    .AddDefaultSiteRepository()
    .AddDefaultComponentLists()
    .AddDefaultExportTypeServices()
    .AddDefaultActionServices()
    .AddDefaultActions()
    .AddDefaultHtmlGeneratorServices()
    .AddDefaultJsonGeneratorServices()
    .AddDefaultImageCropServices()
    .AddDefaultAutoDeployServices();

builder.Services.AddSingleton<IStaticSiteStorer>(new ConfiguredFolderStorer(@"D:\static-output"));

xStatic.DeployServiceBuilder.AddDeployersAutomatically();
xStatic.DeployServiceBuilder.AddDeploymentTargetCreatorsAutomatically();

xStatic.UseSecureUserGroups().Build();
```

The two deploy calls are separate statements because `AddDeployersAutomatically()` returns `IDeployServiceBuilder`, which doesn't have `AddDeploymentTargetCreatorsAutomatically()`. See [Extending-xStatic.md](Extending-xStatic.md#manual-registration) for the full builder reference.

Register the storer as a singleton. The generators are singletons and take the storer in their constructors, so they hold one instance for the life of the app.

## Next steps

- [Generating-and-Deploying.md](Generating-and-Deploying.md) for how editors use **Generate**, **Clean**, **Download** and **Deploy**
- [Architecture.md](Architecture.md#where-data-lives) for where everything is stored
- [Extending-xStatic.md](Extending-xStatic.md) for the builders and the other extension points
- [Writing-a-Generator.md](Writing-a-Generator.md), which calls the storer
