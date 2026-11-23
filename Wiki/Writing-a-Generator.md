How to write your own generator, the part of xStatic that turns a content node or media item into stored files. It is for developers. Most sites never need one, because you can change the output with [transformers](Writing-a-Transformer.md) and [file name generators](File-Name-Generators.md). Write a generator when you need a different kind of file, such as JSON, XML or plain text, or a different source for the page content.

## At a glance

- Inherit `GeneratorBase` and implement one method, `GeneratePage`.
- Register the class in DI as a singleton. It has constructor arguments, so xStatic can't create it by itself.
- xStatic finds it by scanning, so it then shows up in the **Generator** dropdown of an [export type](Export-Types.md).
- Create an export type that uses it, then pick that export type on a [site](Sites.md).

## What a generator does

A generator handles four kinds of item. `RebuildProcess` calls it through `JobRunner` once per item (see [Architecture.md](Architecture.md#jobs-jobbuilder-job-and-jobrunner)).

| `IGenerator` method | Called for | Built in `GeneratorBase`? |
|---------------------|------------|---------------------------|
| `GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null, string culture = null)` | Each page, once per configured culture | No. You write it |
| `GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null)` | Each media item | Yes (virtual) |
| `GenerateFolder(string absolutePath, string relativePath, int staticSiteId)` | Each asset folder | Yes (virtual) |
| `GenerateFile(string absolutePath, string relativePath, int staticSiteId)` | Each asset file | Yes (virtual) |

Each method returns a `GenerateItemResult` (or a list of them for folders), which becomes a line in the run's results. Use `GenerateItemResult.Success(type, item, message)` and `GenerateItemResult.Error(type, item, message)`. Return `null` from `GeneratePage`, `GenerateMedia` or `GenerateFile` to skip an item without reporting it. `JobRunner` drops `null` results. `GenerateFolder` must return a list (an empty one to skip), because `JobRunner` throws on `null` there and the whole run fails.

`IGenerator` is in the `XStatic.Core.Generator` namespace ([IGenerator.cs](../Source/XStaticCore/XStatic.Core/Generator/IGenerator.cs)).

## Inheriting GeneratorBase

[`GeneratorBase`](../Source/XStaticCore/XStatic.Core/Generator/GeneratorBase.cs) gives you the media, folder and file handling, an `HttpClient`, and helpers for the page work. Its constructor is protected and takes eight services, which your constructor passes on:

```csharp
protected GeneratorBase(IUmbracoContextFactory umbracoContextFactory,
    IPublishedUrlProvider publishedUrlProvider,
    IStaticSiteStorer storer,
    IImageCropNameGenerator imageCropNameGenerator,
    MediaFileManager mediaFileSystem,
    IWebHostEnvironment hostingEnvironment,
    IOptions<XStaticGlobalSettings> globalSettings,
    ILogger<GeneratorBase> logger)
```

### What you can use

| Member | Kind | What it gives you |
|--------|------|-------------------|
| `GetNode(int id)` | protected method | The published content for an id, or `null` |
| `GetMedia(int id)` | protected method | The published media for an id, or `null` |
| `GetContext()` | protected method | The current `IUmbracoContext` |
| `RunTransformers(string fileData, IEnumerable<ITransformer> transformers)` | protected method | Runs the transformers in list order. A `null` list or `null` text comes back unchanged |
| `Store(int staticSiteId, string filePath, string fileData)` | protected method | Writes text to the site's output through the storer, using `DefaultEncoder`. Returns the stored location |
| `Copy(int staticSiteId, string absoluteFilePath, string filePath)` | protected method | Copies a file into the output |
| `Save(int staticSiteId, Stream stream, string filePath)` | protected method | Saves a stream into the output |
| `GetFileDataFromWebClient(string absoluteUrl)` | protected virtual method | Downloads a URL as text. Returns `null` on an HTTP error or exception (it logs, and doesn't throw) |
| `SaveFileDataFromWebClient(string absoluteUrl, string filePath)` | protected method | Streams a download to a file. Returns `null` on failure |
| `GetCropUrl(string mediaUrl, string absoluteUrl, Crop crop)` | protected virtual method | The URL a crop is downloaded from. See below |
| `CanFileTypeBeCropped(string fileExtension)` | protected virtual method | `true` for `jpg`, `jpeg`, `png`, `gif` and `webp` |
| `DefaultEncoder` | protected static field | UTF-8 without a byte order mark |
| `ResizeExtensions` | protected field | The croppable extensions |
| `HttpClient` | protected field | The client used for page and crop downloads. One per generator instance |
| `Logger` | protected property | An `ILogger<GeneratorBase>` |
| `_publishedUrlProvider`, `_umbracoContextFactory`, `_storer`, `_imageCropNameGenerator`, `_mediaFileSystem`, `_fallback` | protected fields | The services you passed in, and a no-op published value fallback |
| `ImageUrlGenerator` | protected property (get and set) | Umbraco's `IImageUrlGenerator`, resolved on first use. Set it in tests or subclasses |

**Encoding.** `DefaultEncoder` is UTF-8 with no byte order mark. This matters for JSON, which must not start with one. `Store` always uses it.

**Cultures.** `JobRunner` calls `GeneratePage` once for each culture on the site, passing the culture code. With no cultures it passes `null`. Pass the value on to `node.Url(...)` so each culture gets its own URL, and therefore its own file. See [Multi-Language-Sites.md](Multi-Language-Sites.md). Only pages are culture aware. Media and assets are generated once.

**Crop URLs.** `GetCropUrl` builds the URL a crop is downloaded from, with the `Max` crop mode and the width, height and optional quality. If Umbraco has an `IImageUrlGenerator`, it is used, so the URL carries the HMAC signature when `Umbraco:CMS:Imaging:HMACSecretKey` is set. Without one, it falls back to an unsigned query string (`?mode=max&width=...&height=...`), which only works when no key is set. Override it if your images are served from somewhere else. See [Image-Crops.md](Image-Crops.md).

### The usual order of work

For each page, a generator normally does the same five things:

1. Get the node with `GetNode(id)`. Return `null` if it is missing.
2. Work out the URL with `node.Url(_publishedUrlProvider, mode: UrlMode.Relative, culture: culture)`.
3. Produce the content: download the rendered page, or build it from the node.
4. Run the transformers with `RunTransformers`.
5. Get the file path from `fileNamer.GetFilePartialPath(url)` and write it with `Store`.

### Handle your own errors

`JobRunner` doesn't catch exceptions from a generator. An exception that escapes `GeneratePage` is caught by `RebuildProcess`, which abandons the whole run and returns a failed result. Wrap your page work in `try`/`catch` and return `GenerateItemResult.Error(...)` so one bad page only fails that page.

## Example: a plain text generator

This generator writes one `.txt` file per page, containing the page name and URL. It shows every part you need: the constructor, `GeneratePage`, and the registration.

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.App;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace MySite.Export;

public class PlainTextGenerator : GeneratorBase
{
    public PlainTextGenerator(
        IUmbracoContextFactory umbracoContextFactory,
        IPublishedUrlProvider publishedUrlProvider,
        IStaticSiteStorer storer,
        IImageCropNameGenerator imageCropNameGenerator,
        MediaFileManager mediaFileSystem,
        IWebHostEnvironment hostingEnvironment,
        IOptions<XStaticGlobalSettings> globalSettings,
        ILogger<GeneratorBase> logger)
        : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator,
               mediaFileSystem, hostingEnvironment, globalSettings, logger)
    {
    }

    public override async Task<GenerateItemResult> GeneratePage(
        int id,
        int staticSiteId,
        IFileNameGenerator fileNamer,
        IEnumerable<ITransformer> transformers = null,
        string culture = null)
    {
        var node = GetNode(id);

        if (node == null)
        {
            return null; // skip silently
        }

        try
        {
            var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative, culture: culture);

            var text = $"{node.Name}{Environment.NewLine}{url}";
            var transformed = RunTransformers(text, transformers);

            var filePath = fileNamer.GetFilePartialPath(url);
            var location = await Store(staticSiteId, filePath, transformed);

            return GenerateItemResult.Success("Page", node.Name, location);
        }
        catch (Exception e)
        {
            Logger.LogError(e, "Error generating page {Name}", node.Name);
            return GenerateItemResult.Error("Page", node.Name, e.Message);
        }
    }
}
```

The page item label is up to you. The built-in generators use the node's URL segment, so results show the segment rather than the full URL.

### Register it

Register the concrete type as a singleton in a composer:

```csharp
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace MySite.Export;

public class PlainTextGeneratorComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<PlainTextGenerator>();
    }
}
```

It has to be the concrete type. When a site generates, xStatic loads the saved type name and asks the container for that exact type. If it isn't registered, xStatic tries `Activator.CreateInstance`, which fails because there is no parameterless constructor. The run then fails with the error message.

Use a singleton: the built-in generators are singletons, so each one keeps a single `HttpClient`.

### Make it selectable

An export type needs three parts: a generator, a transformer factory and a file name generator. You have the generator. For this example, add a transformer factory that does nothing and a file name generator that ends in `.txt` (or reuse built-in ones where they fit):

```csharp
using System.Collections.Generic;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace MySite.Export;

public class NoTransformersListFactory : ITransformerListFactory
{
    public IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig) => [];
}

public class TxtFileNameGenerator : IFileNameGenerator
{
    public string GetFilePartialPath(string relativeUrl)
    {
        var trimmed = relativeUrl?.Trim('/');

        return string.IsNullOrEmpty(trimmed) ? "index.txt" : trimmed + ".txt";
    }
}
```

Neither needs registering, because both have parameterless constructors. Then:

1. Build and run the site, so xStatic scans your assembly.
2. In the **xStatic** section, open the **Export Types** tab and click **Create new Export Type**.
3. Enter an **Export Type Name \***, then choose `NoTransformersListFactory` as the **Transformer Factory \***, `PlainTextGenerator` as the **Generator \*** and `TxtFileNameGenerator` as the **File Name Generator \***.
4. On a site, pick that export type. See [Sites.md](Sites.md).

The dropdowns show class names, so give your classes distinctive names. A JSON export type is built the same way. See [JSON-Export.md](JSON-Export.md).

## Customising the built-in JSON output

If you only want different JSON, inherit `BasicJsonApiGenerator` and override `GetJsonData`. Its namespace is `XStatic.Generator`, not `XStatic.Core.Generator`:

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using XStatic.Core.App;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Generator;

namespace MySite.Export;

public class SlimJsonGenerator : BasicJsonApiGenerator
{
    public SlimJsonGenerator(
        IUmbracoContextFactory umbracoContextFactory,
        IPublishedUrlProvider publishedUrlProvider,
        IStaticSiteStorer storer,
        IImageCropNameGenerator imageCropNameGenerator,
        MediaFileManager mediaFileSystem,
        IWebHostEnvironment hostingEnvironment,
        IOptions<XStaticGlobalSettings> settings,
        ILogger<GeneratorBase> logger)
        : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator,
               mediaFileSystem, hostingEnvironment, settings, logger)
    {
    }

    protected override string GetJsonData(IPublishedContent content)
    {
        var json = new JObject
        {
            ["id"] = content.Id,
            ["name"] = content.Name,
            ["type"] = content.ContentType.Alias
        };

        return json.ToString();
    }
}
```

Register it with `builder.Services.AddSingleton<SlimJsonGenerator>()` as above.

## The built-in generators

| Generator | Namespace | Source of content | Template needed? | Pairs with |
|-----------|-----------|-------------------|------------------|------------|
| `StaticHtmlSiteGenerator` | `XStatic.Core.Generator` | Downloads the page over HTTP from the running site | Yes. Pages with no template are skipped silently | `DefaultHtmlTransformerListFactory` and `EverythingIsIndexHtmlFileNameGenerator` |
| `BasicJsonApiGenerator` | `XStatic.Generator` | Builds JSON from the published content | No. Every published node is generated | `DefaultJsonTransformerListFactory` and `JsonFileNameGenerator` |

Both are good references to read:

- [StaticHtmlSiteGenerator.cs](../Source/XStaticCore/XStatic.Core/Generator/StaticHtmlSiteGenerator.cs) reports a failed download as an error against the page and stores nothing for it.
- [BasicJsonApiGenerator.cs](../Source/XStaticCore/XStatic.Core/Generator/BasicJsonApiGenerator.cs) writes `__id`, `__name`, `__contentTypeAlias` and similar fields followed by every property, plus a `_GENERATED_ON_` time, so its output differs on every run. The culture only changes the URL and file name, not the property values it writes.

## Next steps

- [File-Name-Generators.md](File-Name-Generators.md) to control the file path of each page
- [Writing-a-Transformer.md](Writing-a-Transformer.md) to change a page after it is generated
- [Export-Types.md](Export-Types.md) to combine the parts in the backoffice
- [Extending-xStatic.md](Extending-xStatic.md) for the other extension points
