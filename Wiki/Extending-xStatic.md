Every part of xStatic that you can replace or add to, how each one is registered, and how to take over the registration yourself. It is for developers writing plugins or customising a site. Read [Architecture.md](Architecture.md) first if you want the background.

## At a glance

- Reference only the `xStatic.Core` package from a plugin. Its public types are the extension API.
- Most extensions need no registration code. Implement the interface and xStatic finds it.
- A custom generator needs one line of registration, because it has constructor arguments.
- To replace a built-in service (a storer, say), register your own after xStatic's setup. To control everything, opt out of the default setup and call the builders yourself.

## The extension points

| Interface | What it is for | How it is registered | Page |
|-----------|----------------|----------------------|------|
| `IGenerator` (usually via `GeneratorBase`) | Turns a content node or media item into stored files | Found by scanning. Also register it in DI as a singleton (it needs constructor arguments) | [Writing-a-Generator.md](Writing-a-Generator.md) |
| `ITransformer` | Changes a page's text after it is generated | Not registered. Created by a transformer list factory | [Writing-a-Transformer.md](Writing-a-Transformer.md) |
| `ITransformerListFactory` | Decides which transformers run for a site, and in what order | Found by scanning. DI registration is optional | [Writing-a-Transformer.md](Writing-a-Transformer.md) |
| `IFileNameGenerator` | Maps a page URL to an output file path | Found by scanning. DI registration is optional | [File-Name-Generators.md](File-Name-Generators.md) |
| `IImageCropNameGenerator` | Names the cropped image files | DI service. Replace the default registration | [File-Name-Generators.md](File-Name-Generators.md#image-crop-names) |
| `IStaticSiteStorer` | Decides where generated files are written | DI service. Replace the default registration | [Site-Storers.md](Site-Storers.md) |
| `IDeployer`, `IDeployerDefinition`, `IDeployerAutoInstaller` | Sends the output folder somewhere | The auto installer is found by scanning, or call `AddDeployer` | [Writing-a-Deployer.md](Writing-a-Deployer.md) |
| `IDeploymentTargetCreator` and its definition and auto installer | Creates a deployment target for the editor, such as the Netlify site creator | The auto installer is found by scanning, or call `AddDeploymentTargetCreator` | [Deployment-Target-Creators.md](Deployment-Target-Creators.md) |
| `IPostGenerationAction` | Runs a step after generation (copy a file, write metadata, call an API) | Found by scanning. DI registration is optional only if it has a parameterless constructor | [Writing-a-Post-Generation-Action.md](Writing-a-Post-Generation-Action.md) |
| `IAutoPublisher` | Reacts to content being published | DI service. Replace the default registration | [Auto-Publish.md](Auto-Publish.md) |
| `ISitesRepository`, `IExportTypeRepository`, `IExportTypeService`, `IActionRepository`, `IActionFactory`, `IDeploymentTargetRepository` | Where xStatic's own settings are read and written, and how types are turned into objects | DI services. Replace the default registrations | [Architecture.md](Architecture.md) |

"Found by scanning" means xStatic looks through the loaded assemblies for concrete implementations when it starts (or, for the list classes, when they are first used), and the backoffice dropdowns then show them. "DI service" means you register it in the container and the last registration wins. See [How plugins are discovered](Architecture.md#how-plugins-are-discovered).

Things worth knowing:

- A type is picked in the backoffice by its class name. The export type stores the full type name, so renaming or moving a class that an export type uses breaks that export type.
- The full type names are saved as assembly-qualified names. Keep your plugin's assembly name stable.
- If you want a custom generator, file name generator or transformer factory to be selectable, it only has to exist in a loaded assembly. See [Export-Types.md](Export-Types.md) for the backoffice side.

## Replacing one service

You don't need to opt out of the default setup just to swap one piece. The composer registers the defaults, and when the same service is registered twice the container uses the last one. So register yours after the composer has run.

The simplest place is `Program.cs`, after the Umbraco builder has run its composers:

```csharp
using XStatic.Core.Generator.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

// Registered after the composers, so this wins over the default AppDataSiteStorer.
builder.Services.AddSingleton<IStaticSiteStorer, MyStorer>();

WebApplication app = builder.Build();
```

`MyStorer` is your own `IStaticSiteStorer` (see [Site-Storers.md](Site-Storers.md#writing-a-custom-storer)).

If you would rather use a composer, mark it `[ComposeAfter(typeof(XStatic.XStaticComposer))]` (from `Umbraco.Cms.Core.Composing`) so it runs after xStatic's.

## Manual registration

If you want to choose every service yourself, call the builders in `XStatic.Core.App`. They are the same ones the composer uses.

Start with `services.AddXStatic()`. It binds the `XStatic` section of `appsettings.json` to `XStaticGlobalSettings` and returns an `XStaticServiceBuilder` ([XStaticApp.cs](../Source/XStaticCore/XStatic.Core/App/XStaticApp.cs)), which exposes the two lower-level builders:

- `GeneratorServiceBuilder` for generation and storage services
- `DeployServiceBuilder` for deployers and deployment target creators

### XStaticServiceBuilder

| Method | What it does |
|--------|--------------|
| `Automatic()` | Registers all the generator defaults (`GeneratorServiceBuilder.AddDefaults()`) and discovers every deployer and deployment target creator by scanning. Uses the default `AppDataSiteStorer`. It does not turn on user groups and does not call `Build()` |
| `AutomaticWithSingleSiteOutput(string outputFolderName = "DefaultOutputFolder")` | Same as `Automatic()`, but registers the `CustomDefinedSingleSiteStorer` instead of the default storer. Output goes to one named folder. See [Site-Storers.md](Site-Storers.md#single-site-output) |
| `UseSecureUserGroups()` | Turns on the two xStatic user groups and uses the root user to create them. See [User-Groups-and-Security.md](User-Groups-and-Security.md) |
| `UseSecureUserGroups(string adminUserToCreateRoles)` | Same, but uses the named user, looked up by username, to create the groups and assign them |
| `TrustUnsafeSslConnectionWhenGenerating()` | Makes the generator accept any HTTPS certificate. Needed on Linux when the site uses a development certificate. Same as `XStatic:TrustSslWhenGenerating` |
| `DoNotDeletePathsWhenClearing(params string[] paths)` | Files and folders kept when a site's output is cleared. Replaces the defaults (`.git` and `CNAME`). Same as `XStatic:DoNotDeletePaths` |
| `ExcludeGeneratingDocTypes(IList<string> docTypeAliases)` | Document type aliases to leave out of generation. Same as `XStatic:ExcludeGeneratingDocTypes` |
| `Build()` | Finishes the registration. It registers the deployer service, the deployment target creator service and the deployment target repository. Always call it last |

Every method returns the builder, so they chain. Settings set here override the same settings in `appsettings.json`. See [Configuration.md](Configuration.md).

### GeneratorServiceBuilder

Every method returns the `GeneratorServiceBuilder`, so you can chain them.

| Method | Registers |
|--------|-----------|
| `AddDefaultSiteRepository()` | `ISitesRepository` as `SitesRepository` (singleton). This is the registration the composer looks for when deciding whether to opt out |
| `AddDefaultExportTypeServices()` | `IExportTypeService` as `DatabaseExportTypeService`, and `IExportTypeRepository` as `ExportTypeRepository` (singletons) |
| `AddDefaultActionServices()` | `IActionRepository` as `ActionRepository`, and `IActionFactory` as `ActionFactory` (singletons) |
| `AddDefaultActions()` | The built-in actions as transient services: `AddGenerationMetadataFileAction`, `FileCopyAction`, `FileDeleteAction`, `FileRenameAction` |
| `AddDefaultHtmlGeneratorServices()` | `StaticHtmlSiteGenerator` (singleton) and `DefaultHtmlTransformerListFactory` (transient) |
| `AddDefaultJsonGeneratorServices()` | `BasicJsonApiGenerator` (singleton) and `DefaultJsonTransformerListFactory` (transient) |
| `AddDefaultImageCropServices()` | `IImageCropNameGenerator` as `ImageCropNameGenerator` (singleton) |
| `AddDefaultSiteStorageServices()` | `IStaticSiteStorer` as `AppDataSiteStorer` (singleton) |
| `AddSingleSiteStorageServices(string outputFolderName)` | `IStaticSiteStorer` as a `CustomDefinedSingleSiteStorer` writing to `umbraco/Data/xStatic/output/<outputFolderName>` |
| `AddDefaultAutoDeployServices()` | `IAutoPublisher` as `DefaultAutoPublisher` (singleton) |
| `AddDefaultComponentLists()` | `GeneratorList`, `TransformerList`, `FileNameGeneratorList` and `PostGenerationActionsList` (singletons). These feed the backoffice dropdowns |
| `AddDefaults()` | All of the above, with the default storer |
| `AddSingleSiteDefaults(string folderName)` | All of the above, with the single-site storer |
| `Build()` | Does nothing. It exists for symmetry |

`services.AddXStaticGenerator()` is a shortcut that creates a `GeneratorServiceBuilder` without binding the settings.

### DeployServiceBuilder

`DeployServiceBuilder` implements `IDeployServiceBuilder`, which has just `AddDeployer` and `Build`. The plugin packages extend that interface (`AddFtpDeployer()`, `AddGitDeployer()`, `AddNetlifyDeployer()`), so they work on `DeployServiceBuilder` as well.

| Method | What it does |
|--------|--------------|
| `AddDeployer(IDeployerDefinition definition, Func<Dictionary<string, string>, IDeployer> deployerConstructor)` | Registers one deployer under `definition.Id`. A duplicate id throws |
| `AddDeployersAutomatically()` | Scans for every `IDeployerAutoInstaller` and registers each one |
| `AddDeploymentTargetCreator(IDeploymentTargetCreatorDefinition definition, Func<Dictionary<string, string>, IDeploymentTargetCreator> constructor)` | Registers one deployment target creator. Defined on the class, not on `IDeployServiceBuilder` |
| `AddDeploymentTargetCreatorsAutomatically()` | Scans for every `IDeploymentTargetCreatorAutoInstaller` |
| `AddDefaultDeploymentTargetServices()` | Registers `IDeploymentTargetRepository` as `DeploymentTargetRepository`. `Build()` calls it for you |
| `Build()` | Registers `IDeployerService` and `IDeploymentTargetCreatorService`, built from what you added, then the deployment target repository |

The deployers are collected as you call the methods, and turned into the `IDeployerService` when you call `Build()`. Add all of them before that. Netlify also has `services.AddNetlifyActions()`, which registers its 404 action.

### A complete manual setup

This is a `Program.cs` that opts out of the default setup and registers the file system and FTP deployers by hand:

```csharp
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Ftp;

var builder = WebApplication.CreateBuilder(args);

var xStatic = builder.Services.AddXStatic();

xStatic.GeneratorServiceBuilder.AddDefaults();

xStatic.DeployServiceBuilder
    .AddDeployer(new FileSystemDeployerDefinition(), parameters => new FileSystemDeployer(parameters))
    .AddFtpDeployer();

xStatic
    .UseSecureUserGroups()
    .Build();

builder.CreateUmbracoBuilder()
    .AddBackOffice()
    .AddWebsite()
    .AddComposers()
    .Build();

WebApplication app = builder.Build();
```

Notes on this:

- Register xStatic before `AddComposers()`, so the registration is there when `XStaticComposer` checks for it.
- This setup has no `AddNetlifyDeployer()` or similar, so only the file system and FTP deployers appear. Don't call `AddDeployersAutomatically()` as well, or the same ids are added twice and startup throws.
- Without `UseSecureUserGroups()`, every signed-in backoffice user can reach every xStatic endpoint, including the ones that expose deployer secrets. Keep it unless you have a reason not to.

## Opting out of the default setup

`XStaticComposer` ([source](../Source/XStaticCore/XStatic/XStaticComposer.cs)) looks to see whether an `ISitesRepository` has been registered. If it has, it skips its own setup. So to take over:

1. Register xStatic yourself, before Umbraco's composers run. In `Program.cs` that means before `AddComposers()`, as above. Any of these registers `ISitesRepository`: `AddDefaults()`, `AddSingleSiteDefaults()`, `AddDefaultSiteRepository()`, `Automatic()` or `AutomaticWithSingleSiteOutput()`.
2. Provide everything xStatic needs. The composer always registers three Umbraco notification handlers (database migration, user group creation and auto publish), whatever you do. They need `IAutoPublisher`, so make sure `AddDefaultAutoDeployServices()` (or your own `IAutoPublisher`) is registered, and call `Build()` so `IDeployerService` exists.
3. Remember that opting out also drops the composer's own defaults. `Automatic()` doesn't turn on user groups, so add `UseSecureUserGroups()` if you want them.

A shorter version is `Automatic()` with options. For example, on Linux or a Mac with a dev certificate:

```csharp
using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .UseSecureUserGroups()
    .TrustUnsafeSslConnectionWhenGenerating()
    .Build();
```

Most of these options also exist as `appsettings.json` settings, which need no code and don't need an opt-out. Check [Configuration.md](Configuration.md) before writing code for a setting.

If you don't opt out, you can't change `Automatic()`'s choices from code, but you can still override any individual service as shown in [Replacing one service](#replacing-one-service).

## API stability

Everything public in `xStatic.Core` is treated as public API, because plugins and your own code build against it. In practice:

- Within a major version, minor and patch releases don't remove or change public interface members, constructor signatures or virtual methods that your code could depend on.
- New abilities arrive as new interfaces, overloads, default interface members or additional constructors that keep the old one. Old members may be marked `[Obsolete]` first and removed in a later major version.
- Major versions follow Umbraco's majors (xStatic 18 is for Umbraco 18). A new major can break compatibility, so recompile your plugins against it. See [Upgrading.md](Upgrading.md).
- Anything inside `xStatic` (the controllers, migrations and the backoffice client) is not an extension API. Don't call it from plugin code.
- The generated Management API client in `XStatic.RemoteOperations` follows the API, not this promise. See [Management-API.md](Management-API.md).

## Next steps

- [Writing-a-Generator.md](Writing-a-Generator.md), [Writing-a-Transformer.md](Writing-a-Transformer.md) and [File-Name-Generators.md](File-Name-Generators.md) for changing what is produced
- [Site-Storers.md](Site-Storers.md) for changing where it is stored
- [Writing-a-Deployer.md](Writing-a-Deployer.md) and [Deployment-Target-Creators.md](Deployment-Target-Creators.md) for changing where it goes
- [Writing-a-Post-Generation-Action.md](Writing-a-Post-Generation-Action.md) for steps after generation
