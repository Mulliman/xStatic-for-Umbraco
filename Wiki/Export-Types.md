An export type chooses the building blocks xStatic uses to turn a Umbraco page into a file: a generator, a list of
transformers and a way of naming files. Every [site](Sites.md) uses one. This page covers the built-in **HTML Website**
type, the fields in the export type dialog, and how to make a JSON export type.

## At a glance

- xStatic adds an export type called **HTML Website** the first time it starts. It is what you want for a normal static
  site, and you can use it without changing anything.
- You only need another export type to change the output: for example JSON files instead of HTML, or your own
  generator or transformers.
- An export type is three choices from dropdowns. The dropdowns list every matching class xStatic can find, including
  ones from your own code and plugins.
- Normal users can create, edit and delete export types. That is intentional, because they are only choices between
  installed components and hold no secrets.

## The built-in HTML Website type

This is the export type xStatic adds for you. It is inserted by xStatic's first database migration, so it is there on a new install.

| Setting | Value |
|---------|-------|
| **Export Type Name** | HTML Website |
| **Transformer Factory** | `DefaultHtmlTransformerListFactory` |
| **Generator** | `StaticHtmlSiteGenerator` |
| **File Name Generator** | `EverythingIsIndexHtmlFileNameGenerator` |

What each of those does:

- **`StaticHtmlSiteGenerator`** downloads each published page's rendered HTML from your running site, using the
  page's absolute URL. It skips nodes that have no template.
- **`DefaultHtmlTransformerListFactory`** builds the list of changes made to every page. It always adds a transformer
  that writes a `<!-- Cached by xStatic -->` comment before `</body>`, adds the [image crop](Image-Crops.md) URL rewriter when the site has **Image Crops**,
  and adds the hostname swap when the site has a **Target Hostname**.
- **`EverythingIsIndexHtmlFileNameGenerator`** saves every page as `index.html` inside a folder named after the page's
  URL. `/about/` is saved as `about/index.html`, and the home page as `index.html`. This gives clean URLs on almost any
  host.

You can edit or delete the **HTML Website** type like any other. If you delete it, create another before you build
sites again.

## Create an export type

1. Open **xStatic > Export Types**.
2. Click **Create new Export Type** (or the **+** in the card's header).
3. Fill in the dialog, headed **Create new export type**:

   | Field | Required | What it does | Where the choices come from |
   |-------|----------|--------------|-----------------------------|
   | **Export Type Name \*** | Yes | The name shown on the card and in the site dialog. Keep it under 100 characters, which is the size of the database column | You type it |
   | **Transformer Factory \*** | Yes | "This is the component that decides what transformers are run and in which order." | Every class that implements `ITransformerListFactory` |
   | **Generator \*** | Yes | "This is the component that creates the static files for each page." | Every class that implements `IGenerator` |
   | **File Name Generator \*** | Yes | "This is the component that decides the folder and the file name for each page." | Every class that implements `IFileNameGenerator` |

4. Click **Submit**.

If a field is empty, a message appears above it: **Name is required**, **Transformer Factory is required**,
**Generator is required** or **File Name Generator is required**.

The new type appears on the card list, and straight away in the **Export Format** dropdown in the site dialog.

### Where the dropdown options come from

When the site starts, xStatic searches every loaded assembly for concrete classes that implement the three interfaces
and lists them by class name. Nothing needs registering. If you add a class in your own project or install a plugin, it
shows up in the dropdown after a restart. The **Config** tab in the [Backoffice tour](Backoffice-Tour.md#config) shows the
same lists.

The built-in choices are:

| Dropdown | Built-in options |
|----------|------------------|
| **Transformer Factory** | `DefaultHtmlTransformerListFactory`, `DefaultJsonTransformerListFactory` |
| **Generator** | `StaticHtmlSiteGenerator`, `BasicJsonApiGenerator` |
| **File Name Generator** | `EverythingIsIndexHtmlFileNameGenerator`, `JsonFileNameGenerator` |

The type's full assembly-qualified name is what's stored in the database, so the choice survives restarts. If you
later remove a plugin whose class an export type uses, generating sites with that type will fail until you edit the
export type and pick a component that still exists.

To write your own components, see [Writing a generator](Writing-a-Generator.md),
[Writing a transformer](Writing-a-Transformer.md) and [File name generators](File-Name-Generators.md).

## Create a JSON export type

xStatic can output each page as a JSON file for use as a simple headless API, instead of HTML. Create an export type
with these three choices:

| Field | Choose |
|-------|--------|
| **Export Type Name \*** | Anything, for example `JSON API` |
| **Transformer Factory \*** | `DefaultJsonTransformerListFactory` |
| **Generator \*** | `BasicJsonApiGenerator` |
| **File Name Generator \*** | `JsonFileNameGenerator` |

Then create a site and set its **Export Format** to your new type. Generating it writes one `.json` file per page:
`index.json` for the home page and `about.json` for `/about/`. The transformer turns Umbraco content links in the JSON
into links to the matching `.json` files.

The built-in JSON generator is deliberately basic: it dumps the page's properties, and you can extend it for a richer
shape. [JSON export](JSON-Export.md) covers the output and how to customise it.

## Edit an export type

1. Click **Edit** (the brush icon) on the type's card. The dialog is headed **Edit {name} export type**.
2. Change the fields and click **Submit**.

The change applies the next time any site that uses this type is generated. Existing stored files aren't rewritten, so
**Clean** and generate again if you switched, say, the file name generator.

## Delete an export type

1. Click **Delete** (the bin) on the card.
2. Confirm in the **Delete Export Type** dialog.

xStatic doesn't check whether sites use the type. A site whose export type has been deleted loses its **Generate**
button and its **Exports as** line until you edit it and choose another **Export Format**. Only the button is hidden.
A generate that starts some other way (the API, [Remote operations](Remote-Operations.md) or [Auto publish](Auto-Publish.md))
still runs, and because the type can't be found it falls back to the HTML generator and the default HTML transformers.
There is no fallback file name generator, though, so every page fails (the page is downloaded, then the run reports an
`Object reference not set to an instance of an object` error against it). Media, assets and actions still run.

## What the card shows

Each card has the type's name as its headline and a table with the name, the transformer factory, the generator and the
file name generator, all by class name.

## Who can change export types

Export types are available to both user groups. The Management API's export type endpoints sit under `xstatic/config`
and use the normal-user policy, not the admin one. Everything that could hold a secret (deployment targets and actions)
is admin only. See [User groups and security](User-Groups-and-Security.md).

## Next steps

- [Sites](Sites.md): use your export type on a site.
- [JSON export](JSON-Export.md): the headless JSON recipe in full.
- [Architecture](Architecture.md): where generators, transformers and file name generators fit in the pipeline.
