As well as HTML, xStatic can write your published content as JSON files, one per page. A front end such as a JavaScript app, a mobile app or another static site generator can then read the content from any static host. This page explains how to set up a JSON export type, what the files look like and how to use them.

## At a glance

- JSON export is **not** set up for you. The only export type xStatic creates is **HTML Website**, so you make a JSON one yourself. It takes a few minutes.
- It uses three parts: `BasicJsonApiGenerator`, `DefaultJsonTransformerListFactory` and `JsonFileNameGenerator`.
- It doesn't download pages over HTTP, and it doesn't need Razor templates. It reads each published page's properties directly.
- Media, image crop files, asset paths, actions and deployment all work the same as for an HTML site. The HTML-only transformers (image URL rewriting and **Target Hostname**) don't run.

> The separate `xStatic.UmbracoContentApi` package is retired. It failed to start on every version since 17.0.0 because it depended on a library built for Umbraco 9. Remove it from your site and use the steps here instead.

## Set up a JSON export type

1. Open the **xStatic** section and select the **Export Types** tab.
2. Select **Create new Export Type**.
3. Enter an **Export Type Name \***, for example `JSON API`.
4. Choose these three:

   | Field | Choose |
   |-------|--------|
   | **Transformer Factory \*** | `DefaultJsonTransformerListFactory` |
   | **Generator \*** | `BasicJsonApiGenerator` |
   | **File Name Generator \*** | `JsonFileNameGenerator` |

5. Select **Submit**.
6. In the **xStatic Sites** tab, create a site (or edit one) and choose your new type under **Export Format \***.
7. Select **Generate**.

Export types are explained on [Export types](Export-Types.md).

## What the output looks like

### File names

`JsonFileNameGenerator` turns each page's URL into a `.json` file name:

| Page URL | File |
|----------|------|
| `/` | `index.json` |
| `/about/` | `about.json` |
| `/blog/first-post/` | `blog/first-post.json` |

This is different from HTML export, which writes `about/index.html`. If your site has several languages, the language folder comes from the URL as usual, for example `en/about.json` ([Multi-language sites](Multi-Language-Sites.md)).

The output is UTF-8 without a byte order mark, so strict JSON parsers can read it. (Earlier versions added one. This was fixed in 17.3.0 / 18.0.0.)

### File contents

Each file is one JSON object. These fields come first:

| Field | Value |
|-------|-------|
| `_DISCLAIMER_` | A fixed note saying this is a basic auto-generated API |
| `_GENERATED_ON_` | The time of the build |
| `__id` | The page's numeric id |
| `__name` | The page name |
| `__contentTypeAlias` | The document type alias |
| `__contentTypeId` | The document type id |
| `__createDate`, `__updateDate` | When the page was created and last updated |
| `__level` | How deep the page is in the tree |
| `__parent` | The parent page's id, or `null` |
| `__path` | The page's path of ids, such as `-1,1056,1070` |
| `__templateId` | The template id, or `null` |
| `__writerId` | The id of the last user to save the page |

After those, every property on the page's document type is added using its alias as the key. A value is written as JSON where Umbraco can convert it, or as a list of strings for list-like values, and otherwise as the raw saved string.

```json
{
  "_DISCLAIMER_": "This is a basic auto generated API ...",
  "_GENERATED_ON_": "2026-11-21T10:15:00.1234567+00:00",
  "__id": 1070,
  "__name": "About us",
  "__contentTypeAlias": "contentPage",
  "__level": 2,
  "__parent": 1056,
  "pageTitle": "About us",
  "bodyText": "<p>We build static sites.</p>",
  "relatedPage": "about.json"
}
```

The values are illustrative: they depend on your document types and on how Umbraco converts each property editor.

Things to know:

- `_GENERATED_ON_` changes on every build, so every file is different each time, even if the content hasn't changed. A deployer that tracks changes, such as [Git](Deploying-with-Git.md), will see every page as modified.
- Only published pages are written. A page without a template is still written, because JSON export doesn't need templates.
- Property values are not translated. The language only decides the file name ([Multi-language sites](Multi-Language-Sites.md#limitations)).

### Links between pages

The default transformer, `UmbracoContentUdiToJsonUrlTransformer`, finds content links in the JSON (a content picker or a link saves a value like `umb://document/0123...`) and swaps each for the target page's URL plus `.json`. A link to `/about/` becomes `about.json`.

The result has **no leading slash**, so resolve it against the place you host the JSON, for example `new URL(link, "https://api.example.com/")`. A link to a page that can't be found is left as the `umb://` value. Media links (`umb://media/...`) aren't rewritten.

One edge case: a link to the home page at `/` becomes `.json`, not `index.json`, which is the name of the file. If your front end follows links to the home page, handle that yourself (for example by treating an empty name as `index`). A home page at `/en/` is written as `en.json` and its link is `en.json`, so those agree.

## Use the files from a front end

Host the generated folder anywhere that serves static files, using a [deployment target](Deployment-Targets.md) as for any other site. Then fetch the files like any other JSON:

```javascript
const base = "https://api.example.com/";

const home = await fetch(new URL("index.json", base)).then(r => r.json());
const about = await fetch(new URL(home.relatedPage, base)).then(r => r.json());

console.log(about.pageTitle);
```

If the front end runs on a different domain, your host has to send CORS headers (`Access-Control-Allow-Origin`) for the JSON files. xStatic doesn't add any. Netlify, GitHub Pages and most CDNs have a way to set response headers.

The format is fixed and very simple. There's no search, no filtering and no way to list pages (no index file is written), so a front end needs to know the paths it wants, or follow the links between pages.

## Change the output

You can change what goes into each file by writing your own generator that inherits from `BasicJsonApiGenerator` ([BasicJsonApiGenerator.cs](../Source/XStaticCore/XStatic.Core/Generator/BasicJsonApiGenerator.cs)) and overrides `GetJsonData`. It's registered like any other generator ([Writing a generator](Writing-a-Generator.md)). The class lives in the `XStatic.Generator` namespace, not `XStatic.Core.Generator`.

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

public class SlimJsonGenerator : BasicJsonApiGenerator
{
    public SlimJsonGenerator(IUmbracoContextFactory umbracoContextFactory,
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
        return new JObject
        {
            ["id"] = content.Id,
            ["name"] = content.Name
        }.ToString();
    }
}
```

Register the class with the dependency injection container (`services.AddSingleton<SlimJsonGenerator>();`) so xStatic can build it. xStatic finds generator classes by scanning the loaded assemblies, so the class appears in the **Generator** list either way, but an export type that uses an unregistered generator with these constructor parameters fails because xStatic can't construct it.

## Next steps

- [Export types](Export-Types.md)
- [Writing a generator](Writing-a-Generator.md)
- [Writing a transformer](Writing-a-Transformer.md)
- [Generating and deploying](Generating-and-Deploying.md)
