A site is xStatic's saved recipe for one static website: which content to render, how, and where to send it. This page
describes every field in the site dialog, the site card, and how to edit and delete sites. Sites are managed on the
**xStatic Sites** tab, which every xStatic user can see.

## At a glance

- You can have several sites, for example one per content root, or a JSON site beside an HTML one.
- A site needs a **Site Name**, a **Root Node** and an **Export Format**. Everything else is optional.
- Each site stores its generated files separately, under `umbraco/Data/xStatic/output/{site id}`.
- Sites are stored in the `XStaticSiteConfigs14Plus` database table.

## Create a site

1. Open **xStatic > xStatic Sites**.
2. Click **Create new static site**. (The **+** button in the card's header does the same.)
3. Fill in the dialog, headed **Create new site**. The fields are described [below](#the-site-dialog).
4. Click **Submit**.

If a required field is empty, a red message appears above it after you click **Submit** and the dialog stays open.
Click **Cancel** to close the dialog without saving.

Before you create a site it helps to have an [export type](Export-Types.md) (xStatic adds **HTML Website** itself) and,
if you want to deploy, a [deployment target](Deployment-Targets.md). The dialog loads its dropdowns each time you open
it, so anything you add shows up the next time.

## The site dialog

The fields appear in this order. The **Model property** column is the name used by the
[Management API](Management-API.md) (`SiteUpdateModel` in JSON, camelCase).

| Label | Model property | Required | What it is |
|-------|----------------|----------|------------|
| **Site Name \*** | `name` | Yes | A name for the card |
| **Root Node \*** | `rootNode` | Yes | The content node the site is built from |
| **Cultures** | `cultures` | No | Which language variants to build |
| **Media Root Nodes** | `mediaRootNodes` | No | Media folders to copy into the site |
| **Export Format \*** | `exportFormat` | Yes | The [export type](Export-Types.md) to use |
| **Asset Paths** | `assetPaths` | No | Extra files and folders from disk |
| **Image Crops** | `imageCrops` | No | Resized versions of images to generate |
| **Post Generation Actions** | `postGenerationActionIds` | No | [Actions](Post-Generation-Actions.md) to run afterwards |
| **Auto Publish** | `autoPublish` | No | Rebuild and deploy when content is published |
| **Deployment Target** | `deploymentTarget` | No | Where **Deploy** sends the site |
| **Target Hostname** | `targetHostname` | No | The live hostname to put in links |

The dialog only checks that the three required fields have a value. It doesn't check that crops are
well formed, that asset paths exist, or that the hostname is valid. Required-field messages are:

| Field | Message |
|-------|---------|
| **Site Name \*** | Name is required |
| **Root Node \*** | Root node is required |
| **Export Format \*** | Export format is required |

### Site Name

Free text. It's the headline of the site's card. It doesn't need to be unique and isn't used in your pages.

### Root Node

The content node to build from. Pick it with **Choose**. Only one node can be chosen.

xStatic generates the root node and every published page beneath it (its descendants), skipping unpublished pages and,
in HTML exports, nodes without a template. Pages above the root aren't included. Descendants whose document type
is listed in `XStatic:ExcludeGeneratingDocTypes` are left out too, though their child pages are still built. The root
node itself is always built, whatever its type. See [Configuration](Configuration.md).

If the root node is later unpublished or deleted, the card's path shows **Item Not Found** and generation can't find
anything to build.

### Cultures

A tick-box list of the languages set up in Umbraco (up to 100). Description in the dialog: "Choose which language
variant(s) should be used. Leave blank to use the default language."

- Leave all unticked for a site in one language.
- Tick one or more and xStatic generates each page once per ticked culture, using that culture's URL.
- The ticked cultures are saved in a 200-character column on SQL Server, which has room for about 20 culture codes.

See [Multi-language sites](Multi-Language-Sites.md) for how URLs and folders work out.

### Media Root Nodes

Media folders to include, chosen with **Choose** (several allowed). Description: "Select the media folders you want to
include in your static site."

xStatic copies every media file inside each chosen folder, including subfolders, into the site. Each file keeps the
path Umbraco stores it under, for example `media/abc123/photo.jpg`, and is read from Umbraco's media storage. Pages that link to media outside the chosen folders will have broken links in the static
copy. A folder that has since been deleted is skipped without an error.

The chosen folders are saved as a comma-separated list of keys in a 4,000-character column on SQL Server, which has room for about 100 folders. Before 17.3.0 and 18.0.0 the column held 255 characters, so only six folders fitted. The upgrade widens it ([Upgrading](Upgrading.md#what-the-automatic-upgrade-does)).

### Export Format

A dropdown of your [export types](Export-Types.md). Description: "Do you want to export this site as a JSON API or as a
static HTML website." It decides the generator, the transformers and the file names, so choosing a JSON type gives you
`.json` files instead of HTML pages.

### Asset Paths

Files that live on disk rather than in the media library, such as your CSS, JavaScript and fonts. Type a path and press
**Enter** to add it as a tag. Description in the dialog: "Add folder names of files on disk that should also be packaged
up. e.g. /assets/file.js will include the specific file, /assets will include the entire folder, /assets/* will
recursively include all folders and files."

Paths are stored as one comma-separated list in a 1,000-character column, so a path can't contain a comma. [Asset paths](Asset-Paths.md) explains
the matching rules and what happens when a path is missing.

### Image Crops

Resized copies of images, written as `{width}x{height}`, optionally followed by `@{quality}`. Description:
"The image crops you want to generate in the format {width}x{height}. You can also optionally add compression after each
with @{quality}. E.g. 1600x900@80,800x450@50,320x0".

Add one tag per crop. The list is saved as one comma-separated string, in a column that holds 255 characters on SQL
Server. [Image crops](Image-Crops.md) covers the syntax, the file names and how links in your pages are
rewritten.

### Post Generation Actions

A tick-box list of the actions an admin has created on the **Actions** tab. Description: "Choose which actions should be
performed once the pages have been created." Ticked actions run after pages, media and assets are in place, and before
anything is deployed. The list shows names only, so normal users can choose actions without seeing their settings. See
[Post-generation actions](Post-Generation-Actions.md).

The list of chosen ids is stored in a 200-character column on SQL Server, so a site can't have more than a few dozen
actions. (SQLite doesn't enforce the limit.)

### Auto Publish

A toggle. Description: "Select this is you want to generate the site automatically when a node is published." When on,
publishing any content under the site's root node generates and then deploys the site. This only happens for sites with
a **Deployment Target**. See [Auto publish](Auto-Publish.md).

### Deployment Target

A dropdown, with the placeholder "Please select...", of the [deployment targets](Deployment-Targets.md) admins have set
up. Description: "Create and configure your Deployment Targets in the corresponding dashboard, before choosing here."
Without one, the card has no **Deploy** button and [Auto Publish](#auto-publish) does nothing.

### Target Hostname

The hostname you will publish the static site on, such as `www.example.com`. Description: "The site hostname you've
configured for viewing the site locally will be replaced with this value. Do not include the protocol, just the
hostname."

When this is set, the built-in HTML export swaps every hostname in Umbraco's **Culture and Hostnames** settings for
this value in the generated pages. Use it when your Umbraco site runs on `localhost` or a staging domain and the
live static site has another one. It's also shown on the card as a link to `https://{hostname}`.

It only applies to HTML export types that use the default transformer list. The default JSON export doesn't change
hostnames. It does nothing if no hostnames are configured in Umbraco. See [Export types](Export-Types.md).

## The site card

Each site is a card. The details table, the buttons and the progress bar are described in the
[Backoffice tour](Backoffice-Tour.md#xstatic-sites). In short:

| Part | Meaning |
|------|---------|
| Header **Edit** | Opens the dialog, headed **Edit {name} site** |
| Header **Delete** | Deletes the site after you confirm |
| **Generate** | Builds the site |
| **Deploy** | Sends the built site to the deployment target |
| **Clean** | Deletes the built site |
| **Download** | Zips the built site and downloads it |

## Edit a site

1. Click **Edit** (the brush icon) on the site's card.
2. Change what you need and click **Submit**.

The card updates straight away. Changes apply the next time you generate. The files already stored don't change until
then. Moving a site to a different export type or root node means you should **Clean** it and generate again, so old
files don't linger in the output.

## Delete a site

1. Click **Delete** (the bin) on the card.
2. Confirm in the **Delete Site** dialog.

Deleting removes the site's settings only. Its generated files stay on disk under
`umbraco/Data/xStatic/output/{site id}`, and anything already deployed stays where it is. Click **Clean** first if you
want the stored files gone. Deleting a site doesn't delete its export type, actions or deployment target.

## Fields you can't edit

These are set by xStatic and shown on the card or in the API: the last generated time and how long it took, the last
deployed time and how long it took, the size of the stored output, and the display path. The last times are updated
by every generate and deploy, including automatic ones.

## Next steps

- [Generating and deploying](Generating-and-Deploying.md): build and ship the site.
- [Export types](Export-Types.md) and [Deployment targets](Deployment-Targets.md): the things a site points at.
- [Management API](Management-API.md): create and change sites from code.
