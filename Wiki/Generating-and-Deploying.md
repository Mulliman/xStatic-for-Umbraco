This page covers the buttons on each site card in the **xStatic Sites** tab: **Generate**, **Deploy**, **Clean** and **Download**. It explains what each one does, what ends up in the output, and how problems are reported. It's written for editors and admins who run builds day to day.

## At a glance

| Button | What it does | Shown when |
|--------|--------------|------------|
| **Generate** | Builds the site into the output folder on the server | The site's export type still exists |
| **Deploy** | Sends the output folder to the site's deployment target | The site has a deployment target |
| **Clean** (icon button) | Empties the output folder, keeping a few protected paths | The site has been generated and the output isn't empty. If the root page isn't published, the size can't be worked out, so they show whenever the site has been generated |
| **Download** (icon button) | Saves the output folder to your computer as a zip | Same as **Clean** |

All four are available to users in the `xStaticNormalUser` and `xStaticAdmin` groups ([User groups and security](User-Groups-and-Security.md)). The typical routine is **Generate**, look at the result, then **Deploy**.

> **Careful with Clean then Deploy.** **Clean** empties the output folder, and **Deploy** then sends that empty folder. With [FTP](Deploying-to-FTP.md) or [Git](Deploying-with-Git.md) that removes your live site's files. Always **Generate** again before you **Deploy**. [Details below](#deploy).

## The site card

Each site card lists what is known about the site. Most rows only appear when they have something to show:

| Row | Example |
|-----|---------|
| Root node | `Home` or `Parent/Home`. "Item Not Found" means the root page isn't published any more |
| Cultures | `Cultures: en-US \| fr` |
| Export type | `Exports as HTML Website` |
| Publishing | `Auto Publish On` or `Manual Deploy` |
| Last build | `Last generated on 21/11/2026 at 10:15:32` (in your browser's date and time format), or "This site has never been built." |
| Last deploy | `Last deployed on ...`, or "This site has never been deployed." |
| Target | A link to `https://{Target Hostname}` if one is set |
| Size | `Size: 2.4MB`, the size of the output folder |

The card doesn't show how long a build took. xStatic remembers the duration of the last build and deploy and uses it to size the progress bar the next time, so the first run's bar isn't accurate.

## Generate

**Generate** runs the whole build for one site and returns when it's finished. There's no confirmation, and the card shows "Generating..." with a progress bar until it's done. It calls `POST api/v1/xstatic/generate/generate-site` ([Management API](Management-API.md)).

What it builds, in order:

1. **Pages.** The site's root node and every published page below it, once for each selected culture (or once, in the default language, if you chose none).
2. **Media.** Every media item inside the **Media Root Nodes**, saved at its Umbraco path (for example `media/abc123/photo.jpg`). For each image, one resized copy per **Image Crops** entry ([Image crops](Image-Crops.md)).
3. **Asset paths.** The files and folders listed in **Asset Paths** ([Asset paths](Asset-Paths.md)).
4. **Post-generation actions**, in the order stored on the site ([Post-generation actions](Post-Generation-Actions.md)).

Each page goes through the export type's transformers before it's saved ([Export types](Export-Types.md)).

### What is left out

- **Unpublished pages.** xStatic reads the published content cache, so only published pages are included. If the site's root page itself isn't published, no pages are generated at all, and there's no warning about it. The card shows "Item Not Found" as the root node.
- **Pages without a template** are skipped without a message in an HTML export. [JSON export](JSON-Export.md) doesn't need a template.
- **Document types you excluded** with `ExcludeGeneratingDocTypes` ([Configuration](Configuration.md#excludegeneratingdoctypes)). This leaves out the pages of those types only. Their child pages are still generated.
- **Media outside the Media Root Nodes**, and media items that have no file (such as folders).
- Crops are only made for `jpg`, `jpeg`, `png`, `gif` and `webp` files.

### Where the files go

Output is written to your Umbraco site's content root, not into `wwwroot`:

```text
{content root}/umbraco/Data/xStatic/output/{site id}/
```

The site id is the number xStatic gave the site, so two sites never share a folder. There's no setting for this location. If you register xStatic yourself with `AutomaticWithSingleSiteOutput`, all sites write to one named folder instead ([Site storers](Site-Storers.md)).

By default each page is saved as `{url}/index.html`, so `/about/` becomes `about/index.html` and the home page becomes `index.html`.

### Stale files

**Generate doesn't empty the output folder first.** It replaces files it writes this time, but a file from an earlier run stays put if nothing overwrites it. If you unpublish or rename a page, or remove a crop size, the old file remains in the output and is deployed again. To get a clean result, select **Clean** and then **Generate**.

### Results and warnings

A page that fails never stops the rest of the build. When it finishes, the backoffice shows:

- Nothing, if everything worked. The card's "Last generated on" updates.
- A warning toast, **Site generated with N problem(s)**, if any item failed. It lists up to five items as `item: message` and then "...and N more".
- A danger toast, **Generation failed**, with the error message, if the build itself threw an exception, for example because the export type's generator can't be created.

A build that reports problems still counts as a build: "Last generated" is updated, post-generation actions run and the files are on disk. The full list of results (every page, media item and action, successful or not) is only in the API response. If you need it, call the endpoint yourself or use [Remote operations](Remote-Operations.md).

Common warnings:

| Item type | Message | Cause |
|-----------|---------|-------|
| Page | "Could not download the page from {url}. Check the site is running and the URL is reachable from the server." | The server couldn't fetch its own page: wrong host or port, a certificate it doesn't trust ([TrustSslWhenGenerating](Configuration.md#trustsslwhengenerating)), the page returning an error, or no URL for that page in that language, for example because it isn't published in it. Nothing is saved for that page. |
| Media | "Saved the original, but could not download these crops: ..." | The original was saved but a resized copy couldn't be fetched. Check the [HMAC key](Image-Crops.md#signed-urls-and-the-hmac-key). |
| Asset | "Asset path '...' not found" | A path in **Asset Paths** doesn't exist in `wwwroot` or the content root. |
| Folder or File | The file system error | An asset file couldn't be copied. |
| PostAction | The action's error | See [Post-generation actions](Post-Generation-Actions.md#failures). |

Details are also written to the Umbraco log.

## Deploy

**Deploy** sends the generated output to the site's deployment target. Select it, then confirm **Deploy Site** ("Are you sure you want to deploy this site?"). It calls `POST api/v1/xstatic/deploy/deploy-site`.

It deploys whatever is in the output folder right now. It doesn't generate first, so generate again if the content has changed.

If the output folder doesn't exist yet the request fails with "Failed to deploy. No generated output found at '...'. Generate the site before deploying." It also fails if the site has no deployment target ("Deployment target null") or the target has been deleted ("Deployment target not found with id ..."). Those messages are in the API response; the backoffice may only show a generic error.

Things to know:

- **A failed deploy may not look like one.** If the request itself fails, the backoffice shows a general error notification, not the server's message. It doesn't show the message a deployer returns at all, and the API logs a failed result as an error. "Last deployed" is updated either way. After a deploy, check the host (or the Umbraco log) to be sure.
- **Clean doesn't block Deploy.** After **Clean** the output folder still exists, with only the protected paths left in it, so **Deploy** will run and send that. With a deployer that treats the output as the whole site, this removes the live site's files: [FTP](Deploying-to-FTP.md) deletes them from the server and [Git](Deploying-with-Git.md) commits their deletion. Generate again before deploying.
- Deployers differ in what they do with files that are no longer in the output. See the page for your deployer in [Deployment targets](Deployment-Targets.md).

## Clean

**Clean** deletes the generated files for one site. Select it and confirm **Clean Up Site**. It calls `DELETE api/v1/xstatic/sites/clear-stored-site`.

It only touches the output folder on the server. It doesn't affect anything already deployed, and it doesn't delete the site's settings.

Some paths are kept. By default these are `.git` and `CNAME`, so a Git repository in the output survives. A path is kept when it ends with one of the configured values, and only the top level of the output folder is checked. You can change the list with `XStatic:DoNotDeletePaths` ([Configuration](Configuration.md#donotdeletepaths)).

## Download

**Download** zips the output folder and saves it in your browser as `xStatic Site Download-{id}-{timestamp}.zip`. Use it to check what was generated, or to host the site by hand. It calls `GET api/v1/xstatic/download/download-site`.

xStatic makes the zip next to the site's output folder (`.../output/{site id}.zip`) and leaves it there. It's replaced the next time you download.

## Automatic builds

To generate and deploy whenever someone publishes, see [Auto publish](Auto-Publish.md). To run builds on a schedule or from another system, see [Remote operations](Remote-Operations.md).

## Next steps

- [Sites](Sites.md)
- [Post-generation actions](Post-Generation-Actions.md)
- [Troubleshooting](Troubleshooting.md)
