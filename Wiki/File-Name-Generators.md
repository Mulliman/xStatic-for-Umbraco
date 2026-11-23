How xStatic decides what each generated file is called, and how to change it. There are two kinds of namer: file name generators for pages, and image crop name generators for cropped images. This page is for developers. Editors choose a file name generator when they set up an [export type](Export-Types.md).

## At a glance

| Namer | Names | Chosen by | Built in |
|-------|-------|-----------|----------|
| `IFileNameGenerator` | Each page's output file | The **File Name Generator** on an export type | `EverythingIsIndexHtmlFileNameGenerator`, `JsonFileNameGenerator` |
| `IImageCropNameGenerator` | Each cropped copy of an image | Registered in DI (no backoffice choice) | `ImageCropNameGenerator` |

Both interfaces are in the `XStatic.Core.Generator.Storage` namespace.

## File name generators

```csharp
public interface IFileNameGenerator
{
    string GetFilePartialPath(string relativeUrl);
}
```

The generator calls `GetFilePartialPath` for each page with that page's relative URL (for a multi-language site, the URL for that culture, such as `/en/about/`). You return the path of the file to write, relative to the site's output folder. The storer adds the folder and any leading slash is ignored.

Media and asset files don't use a file name generator. Media is stored at its own `/media/...` path and assets at the path you configured.

### The built-in generators

[`EverythingIsIndexHtmlFileNameGenerator`](../Source/XStaticCore/XStatic.Core/Generator/Storage/EverythingIsIndexHtmlFileNameGenerator.cs) trims the slashes from both ends of the URL and adds `/index.html`. Every page becomes a folder with an `index.html`, so a host serves `/about/` without needing an extension. This is the default for the **HTML Website** export type.

[`JsonFileNameGenerator`](../Source/XStaticCore/XStatic.Core/Generator/Storage/JsonFileNameGenerator.cs) trims the slashes and adds `.json`. An empty URL gives `index.json`.

| Page URL | `EverythingIsIndexHtmlFileNameGenerator` | `JsonFileNameGenerator` |
|----------|------------------------------------------|-------------------------|
| `/` | `/index.html` (the leading slash is ignored, so `index.html`) | `index.json` |
| `/about/` | `about/index.html` | `about.json` |
| `/about` | `about/index.html` | `about.json` |
| `/blog/2026/post/` | `blog/2026/post/index.html` | `blog/2026/post.json` |
| `/en/` | `en/index.html` | `en.json` |
| `/en/about/` | `en/about/index.html` | `en/about.json` |
| `/sitemap.xml` | `sitemap.xml/index.html` | `sitemap.xml.json` |
| empty string | `/index.html` | `index.json` |
| `null` | throws `NullReferenceException` | `index.json` |

Two things in that table to be aware of:

- With the HTML namer, a URL that already ends in a file extension (such as `/sitemap.xml`) becomes a folder called `sitemap.xml`. If you need real files there, write a custom namer.
- With the JSON namer, a culture root such as `/en/` becomes `en.json` rather than `en/index.json`.

### Writing a custom file name generator

1. Create a class that implements `IFileNameGenerator`.
2. Build and run the site. xStatic scans loaded assemblies for concrete implementations (`FileNameGeneratorList`), so it appears in the **File Name Generator** dropdown on **Create new Export Type**, listed by class name.
3. Create or edit an export type to use it. See [Export-Types.md](Export-Types.md).

This namer writes every page as a flat `.html` file (`/about/` becomes `about.html`):

```csharp
using XStatic.Core.Generator.Storage;

namespace MySite.Export;

public class FlatHtmlFileNameGenerator : IFileNameGenerator
{
    public string GetFilePartialPath(string relativeUrl)
    {
        var trimmed = relativeUrl?.Trim('/');

        return string.IsNullOrEmpty(trimmed) ? "index.html" : trimmed + ".html";
    }
}
```

No registration is needed for a class with a public parameterless constructor. When a site generates, xStatic loads the saved type, asks the DI container for it, and creates it with `Activator.CreateInstance` if the container doesn't have it. If your namer needs services in its constructor, register the concrete type:

```csharp
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace MySite.Export;

public class FileNamerComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<FlatHtmlFileNameGenerator>();
    }
}
```

Keep these in mind:

- Don't rename or move the class after an export type uses it. The export type saves the full type name, and a run fails if that type can no longer be loaded.
- Your namer is used for every page the export type generates.
- The namer only decides the file name. Links inside the pages are not changed. If you change the file layout, make sure your host serves the files at the URLs the pages link to (for example, that `/about/` finds `about.html`).

## Image crop names

When a site has **Image Crops** set (for example `800x600,400x300@75`), xStatic downloads a resized copy of each croppable image and stores it next to the original. See [Image-Crops.md](Image-Crops.md) for the syntax and how editors use it.

```csharp
public interface IImageCropNameGenerator
{
    string GetCropFileName(string fileNameWithoutExtension, Crop crop);
}
```

[`ImageCropNameGenerator`](../Source/XStaticCore/XStatic.Core/Generator/Storage/ImageCropNameGenerator.cs) is the only built-in implementation. It returns the file name, then `--`, then the width, an `x` and the height:

```text
{fileNameWithoutExtension}--{width}x{height}
```

A missing dimension is written as `0`. The quality is not part of the name.

| Crop setting | Original | Crop file |
|--------------|----------|-----------|
| `800x600` | `/media/abc123/photo.jpg` | `/media/abc123/photo--800x600.jpg` |
| `400x300@75` | `/media/abc123/photo.jpg` | `/media/abc123/photo--400x300.jpg` |
| `300x` | `/media/abc123/photo.png` | `/media/abc123/photo--300x0.png` |
| `x200` | `/media/abc123/photo.png` | `/media/abc123/photo--0x200.png` |

The crop is stored in the same folder as the original, and the extension is written in lower case. Only `jpg`, `jpeg`, `png`, `gif` and `webp` are cropped. Other files, such as SVG and PDF, are copied as they are and produce no crop and no error.

Two crops with the same width and height but different quality would get the same name, and the second overwrites the first. Don't list the same size twice.

### How the pages find the crops

Generating the files is only half of it. Pages still link to the original `/media/...?width=800&height=600` URLs, so the HTML transformer `CroppedImageUrlTransformer` rewrites them to the crop file names, using the same namer. The default HTML transformer list adds it whenever the site has **Image Crops** set. It changes this:

```html
<img src="/media/abc123/photo.jpg?width=800&height=600">
```

into this:

```html
<img src="/media/abc123/photo--800x600.jpg?width=800&height=600">
```

It only matches URLs that contain both `width=` and `height=` with the values from a configured crop.

### Replacing the crop namer

1. Implement `IImageCropNameGenerator`.
2. Register your class so it replaces the default. The default is registered as a singleton, and the last registration wins, so register yours after xStatic's setup (see [Replacing one service](Extending-xStatic.md#replacing-one-service)).
3. Write a transformer list factory that passes your namer to `CroppedImageUrlTransformer`. This step matters. `DefaultHtmlTransformerListFactory` creates its own `new ImageCropNameGenerator()` and ignores the registered one, so without your own factory the files get your names but the page links still use the default names.
4. Create an export type that uses your factory.

```csharp
using System.Collections.Generic;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace MySite.Export;

// Names crops like photo_800w.jpg
public class WidthOnlyCropNameGenerator : IImageCropNameGenerator
{
    public string GetCropFileName(string fileNameWithoutExtension, Crop crop)
    {
        return $"{fileNameWithoutExtension}_{crop.Width ?? 0}w";
    }
}

public class CropAwareHtmlTransformerListFactory(IImageCropNameGenerator cropNamer) : ITransformerListFactory
{
    public IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig)
    {
        yield return new CachedByTransformer();

        if (!string.IsNullOrEmpty(siteConfig.ImageCrops))
        {
            var crops = Crop.GetCropsFromCommaDelimitedString(siteConfig.ImageCrops);
            yield return new CroppedImageUrlTransformer(cropNamer, crops);
        }

        if (!string.IsNullOrEmpty(siteConfig.TargetHostname))
        {
            yield return new HostnameTransformer(siteConfig.TargetHostname);
        }
    }
}
```

```csharp
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using XStatic.Core.Generator.Storage;

namespace MySite.Export;

[ComposeAfter(typeof(XStatic.XStaticComposer))]
public class CropNamerComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<IImageCropNameGenerator, WidthOnlyCropNameGenerator>();
        builder.Services.AddTransient<CropAwareHtmlTransformerListFactory>();
    }
}
```

The factory has a constructor argument, so it must be registered, which is why it is added to the container as well. The `Crop` class and its parsing are covered in [Image-Crops.md](Image-Crops.md).

## Limitations

- The crop file name uses a lower-case extension, but the page rewrite keeps the original's case. For an image stored as `photo.JPG` the crop is saved as `photo--800x600.jpg` while the page is rewritten to `photo--800x600.JPG`. On a host with a case-sensitive file system that link breaks. Use lower-case extensions for media.
- The file name generator is only used for pages. There is no hook for naming media or asset files.

## Next steps

- [Writing-a-Generator.md](Writing-a-Generator.md) for the part that calls the namer
- [Writing-a-Transformer.md](Writing-a-Transformer.md) for transformer list factories
- [Export-Types.md](Export-Types.md) to choose a namer in the backoffice
- [Extending-xStatic.md](Extending-xStatic.md) for the other extension points
