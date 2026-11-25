A post-generation action (an "action") is a small step that runs on the generated files once every page, media file and asset has been created. Use them to copy, rename or delete files, for example to put a copy of a page at `404.html`. This page is for site admins. If you want to write your own, see [Writing a post-generation action](Writing-a-Post-Generation-Action.md).

## At a glance

| Action type | What it does | Fields |
|-------------|--------------|--------|
| `FileCopyAction` | Copies a file inside the site's output folder | **FilePath**, **NewFilePath** |
| `FileRenameAction` | Moves (renames) a file inside the output folder | **FilePath**, **NewFilePath** |
| `FileDeleteAction` | Deletes a file from the output folder | **FilePath** |
| `AddGenerationMetadataFileAction` | Writes a `.xstatic-metadata` text file about the build | None |
| `GenerateCompanionMarkdownAction` | Generates companion `.md` files next to every `.html` page ([AI and GEO](AI-and-GEO.md)) | **ContentSelector**, **ExcludePaths** |
| `GenerateLlmsTxtAction` | Compiles `/llms.txt` and optionally `/llms-full.txt` ([AI and GEO](AI-and-GEO.md)) | **SiteTitle**, **SiteDescription**, **GenerateFullFile**, **GenerateCompanionMarkdown**, **UseMarkdownLinks**, **ExcludePaths** |
| `RagExportPostGenerationAction` | Exports structured RAG chunks (`Jsonl`, `Json`, or `Markdown`) and `webmcp-index.json` ([RAG and WebMCP](RAG-and-WebMCP.md)) | **OutputFormat**, **OutputPath**, **MaxChunkSize**, **ChunkOverlap**, **SplitOnHeadings**, **ExcludedPaths**, **ExcludedDocTypes**, **CustomPropertyAliases**, **GenerateWebMcpIndex**, **WebMcpIndexPath** |
| `Netlify404Action` | Copies a file to `404.html` (only with the `xStatic.Netlify` package) | **FilePath** |
| `CloudflareHeadersAction` | Writes `/_headers` for Cloudflare Workers and Pages, including optional *Markdown for Agents* rules (with `xStatic.Cloudflare`, see [Deploying to Cloudflare](Deploying-to-Cloudflare.md)) | **IncludeMarkdownForAgents**, **CustomRules** |
| `CloudflareRedirectsAction` | Writes `/_redirects` for Cloudflare Workers and Pages (with `xStatic.Cloudflare`, see [Deploying to Cloudflare](Deploying-to-Cloudflare.md)) | **Rules** |
| `AiPreDeployAuditAction` | Runs a deterministic and optional LLM-assisted GEO/SEO audit and saves reports outside the output folder (with `xStatic.AI`, see [AI integration](AI-Integration.md)) | **MaxPages**, **ReportPath**, **FailOnCritical**, **ProfileAlias**, **IncludePaths** |

Actions run after pages, media and assets are saved, and before you deploy. They work on the generated copy of the site only, never on your Umbraco content.

## Create an action

The **Actions** dashboard is only for users in the `xStaticAdmin` group (see [User groups and security](User-Groups-and-Security.md)). Normal users can pick actions for a site but can't create them.

1. Open the **xStatic** section and select the **Actions** tab.
2. Select **Create new Action**, or the **+** button on the same card.
3. Enter an **Action Name \***. This is the name you'll see in the site form and in generation results, so make it descriptive, for example "Copy 404 page". Keep it under 100 characters, which is the size of the database column.
4. Choose an **Action Type \***. The list shows every action class xStatic finds in the loaded assemblies.
5. Fill in the **Configuration** fields. A type with no fields shows "This action type can't be configured".
6. Select **Submit**.

You can use one action type many times with different settings. Each one is a separate action with its own name.

## Add actions to a site

1. In the **xStatic Sites** tab, edit the site.
2. Tick the actions under **Post Generation Actions**.
3. Select **Submit**, then generate the site.

The site form lists actions by the name you gave them. Deleting an action in the Actions dashboard doesn't check whether a site still uses it. A site that points to a deleted action simply skips it.

## How actions run

- They run **after** pages, media and asset files are saved, in the order the ids are stored on the site. The site form doesn't offer a way to reorder them, so don't depend on one action having run before another unless you've checked the result.
- **Every action runs**, even if an earlier one fails, so you see all the problems in one go.
- Paths are relative to the site's output folder (by default `umbraco/Data/xStatic/output/{site id}`). A leading `/` is optional, so `/404/index.html` and `404/index.html` mean the same.
- Actions work on files that are already in the output folder. That includes files left from earlier runs, because xStatic doesn't empty the folder before generating (see [Generating and deploying](Generating-and-Deploying.md#stale-files)).

### Failures

A failing action is reported as a warning under the name you gave it, and the run as a whole is marked unsuccessful. The backoffice shows a toast such as "Site generated with 1 problem", listing `Copy 404 page: Error running file copy action Could not find file ...`. Before xStatic 17.3.0 and 18.0.0 a failed action was wrongly shown as completed.

Typical causes:

- The source file doesn't exist, for example because the page was excluded or generation failed for it.
- A field was left empty.
- The output folder can't be written to.

Two things are not treated as failures. Deleting a file that doesn't exist succeeds quietly (as long as its folder exists), and an action whose type can no longer be found (for example a plugin you removed) is skipped without a message.

## The built-in actions

### FileCopyAction

Copies one file to a new path in the same output folder.

| Field | Meaning |
|-------|---------|
| **FilePath** | The existing file, for example `/error/index.html`. |
| **NewFilePath** | Where to copy it, for example `404.html`. Missing folders are created, and a file already at that path is replaced. |

It copies a single file. It can't copy a whole folder. Don't set **NewFilePath** to the same path as **FilePath**: the existing file at the target is deleted before the copy, so you would lose the file.

### FileRenameAction

Moves one file to a new path. It uses the same two fields as `FileCopyAction`: **FilePath** is the file to move and **NewFilePath** is where it should end up. The original is gone afterwards, and an existing file at the new path is replaced. Folders left empty are not removed. As with copying, don't set **NewFilePath** to the same path as **FilePath**: the file is deleted before the move, so it is lost.

### FileDeleteAction

Deletes one file.

| Field | Meaning |
|-------|---------|
| **FilePath** | The file to delete, for example `/unwanted.txt`. |

### AddGenerationMetadataFileAction

Writes a text file called `.xstatic-metadata` into the root of the output. It has no fields. It lists the site's id, name, root node key, the time of the run (server time), the export type name and, where set, the media root nodes, asset paths, target hostname and image crops.

The file is deployed with the rest of the site, so on most hosts it can be read by anyone who asks for `/.xstatic-metadata`. Don't use it if you don't want that information public.

### Netlify404Action

Only available once `xStatic.Netlify` is installed. It needs no registration: xStatic resolves its constructor dependency from dependency injection when it creates the action (`builder.Services.AddNetlifyActions()` is an optional explicit registration). It's a `FileCopyAction` with the destination fixed to `/404.html`, which is the file name Netlify looks for. It has one field, **FilePath**: the generated page to use as the 404 page. See [Deploying to Netlify](Deploying-to-Netlify.md).

## Recipes

### A 404 page

Create a page in Umbraco at a URL such as `/error/`, then:

| Setting | Value |
|---------|-------|
| **Action Type** | `FileCopyAction` |
| **FilePath** | `/error/index.html` |
| **NewFilePath** | `404.html` |

On Netlify you can use `Netlify404Action` with the same **FilePath** instead. Other hosts use their own rules for 404 pages, so check the host's documentation for the file name.

The default file layout puts every page in its own folder (`error/index.html`). If you aren't sure of a page's path, generate the site and select **Download** to look inside the zip.

### Put the default language at the site root

For a [multi-language site](Multi-Language-Sites.md) where the pages are in folders such as `en/` and `fr/`, a visitor to `/` would otherwise find nothing. Copy the default language's home page to the root:

| Setting | Value |
|---------|-------|
| **Action Type** | `FileCopyAction` |
| **FilePath** | `/en/index.html` |
| **NewFilePath** | `index.html` |

Use the folder name your own site produces.

### Keep a CNAME file

`FileCopyAction` can only copy a file that is already in the output, so it can't create a new `CNAME`. Two ways to get one:

- Put a file called `CNAME` in your site's `wwwroot` and add `/CNAME` to **Asset Paths** ([Asset paths](Asset-Paths.md)).
- If the deployer works from the output folder itself, such as [Git](Deploying-with-Git.md), rely on the default `DoNotDeletePaths`, which keeps `.git` and `CNAME` when you select **Clean** ([Configuration](Configuration.md#donotdeletepaths)).

### Turn a page into a file with another extension

If a template outputs XML, for example at `/sitemap/`, rename the stored page:

| Setting | Value |
|---------|-------|
| **Action Type** | `FileRenameAction` |
| **FilePath** | `/sitemap/index.html` |
| **NewFilePath** | `sitemap.xml` |

### Remove a file you don't want published

Use `FileDeleteAction` with the **FilePath** of the file, for example `/robots-staging.txt`.

## Next steps

- [Writing a post-generation action](Writing-a-Post-Generation-Action.md)
- [Generating and deploying](Generating-and-Deploying.md)
- [Sites](Sites.md)
