Pages are only part of a website. The CSS, JavaScript, fonts and favicon that those pages refer to live on disk, not in Umbraco, so xStatic doesn't know about them until you tell it. The **Asset Paths** field on a site lists the files and folders to copy into the generated output. This page explains how to write the paths and how xStatic finds them.

Images and files in the Umbraco media library are not asset paths. Choose them with **Media Root Nodes** instead ([Sites](Sites.md)).

## At a glance

| Write this | What it copies |
|------------|----------------|
| `/favicon.ico` | One file |
| `/css` | The files directly inside the `css` folder, **not** its subfolders |
| `/css/*` | Every file in `css` and in all its subfolders |
| `/scripts/*.js` | Every `.js` file in `scripts` and its subfolders |

Everything is copied to the same path in the output. `/css/site.css` on disk becomes `css/site.css` in the generated site, so the URLs in your pages keep working.

## Add asset paths

1. In the **xStatic Sites** tab, edit the site.
2. Find **Asset Paths**. It's a tag box: type a path and press Enter to add it, and repeat for each path.
3. Select **Submit**, then **Generate**.

Paths are saved as one comma-separated list, so a path can't contain a comma. The list is limited to 1000 characters in total on SQL Server.

## Folders, files and wildcards

### A single file

`/favicon.ico` or `/robots.txt` copies just that file.

### A folder

`/css` copies the files that sit directly inside the folder. It does **not** copy subfolders. If you have `/css/vendor/lib.css` and want it, add `/css/vendor` as well, or use a wildcard.

### A wildcard

Use `*` or `?` in the file name part of the path:

- `/css/*` copies everything under `css`, including all subfolders.
- `/css/*.css` copies only files ending in `.css`, again including subfolders.
- `/scripts/app?.js` matches `app1.js`, `appA.js` and so on.

A wildcard path is copied recursively. The wildcard has to be in the last part of the path: `/assets/*/site.css` isn't understood, because the folder part must exist exactly as written.

## Where xStatic looks

xStatic can copy from two places. For each path it uses the first match, in this order:

1. A folder in the site's **web root** (`wwwroot`).
2. A folder in the **content root** (the folder that contains `Program.cs` and `appsettings.json`).
3. A file in the web root.
4. A file in the content root.

For a wildcard, it uses the first of the two roots where the folder part of the path exists.

The content root matters because some packages keep their files outside `wwwroot`, for example under `/App_Plugins`. A path such as `/App_Plugins/UmbracoForms/Assets/*` is found there.

Because the content root is searched, **any file under your site's folders can be copied, including ones that were never public**. The output is deployed to a public host, so only list paths you're happy for the world to see. Never add things like `/appsettings.json`.

## Paths that don't exist

A path that can't be found doesn't stop the build. It's reported as a warning, and the other paths and pages are still generated. The warning reads like this:

```text
/App_Plugins/Missing/*: Asset path '/App_Plugins/Missing/*' not found
```

In the backoffice you'll see it in the **Site generated with N problem(s)** toast ([Generating and deploying](Generating-and-Deploying.md#results-and-warnings)). Before xStatic 17.3.0 / 18.0.0 a missing wildcard path stopped the whole generation (issue 77).

If one file inside a found folder can't be copied, only that file is reported.

A wildcard whose folder exists but matches no files copies nothing and isn't reported, so check the file part of the path (`/css/*.cs` finds nothing if you meant `.css`).

## Common paths

Which paths you need depends on your site. The easiest way to find them is to generate the site, open a page of the result, and look for anything that's broken, or to view the source of your live site and look for `href` and `src` values that aren't under `/media`. These are typical:

| Path | Why |
|------|-----|
| `/css` or `/css/*` | Stylesheets. Use `/css/*` if there are subfolders |
| `/scripts` or `/scripts/*` | JavaScript |
| `/fonts/*` | Web fonts |
| `/images/*` | Images that are part of the design, not in the media library |
| `/favicon.ico` | The browser icon |
| `/robots.txt` | Search engine rules |
| `/CNAME` | Custom domain for GitHub Pages ([Deploying with Git](Deploying-with-Git.md)) |

The paths in your Razor templates are what matter. If a template links to `/dist/site.min.css`, the asset path is `/dist/site.min.css` or `/dist/*`.

## Tips

- Assets are copied after pages and media, so an asset can replace a generated file at the same path.
- Don't list paths that overlap, such as `/css/*` and `/css/*.css`, or the same file twice. When a file is picked up a second time, xStatic reports that path as a problem and may skip the rest of it.
- Changing an asset on disk means generating again. xStatic doesn't watch the files.
- A file you remove from **Asset Paths** stays in the output until you **Clean** ([Stale files](Generating-and-Deploying.md#stale-files)).
- Assets don't go through transformers, so the files are byte-for-byte copies. A stylesheet that contains your local hostname isn't rewritten.

## Next steps

- [Sites](Sites.md)
- [Image crops](Image-Crops.md)
- [Generating and deploying](Generating-and-Deploying.md)
