On a normal Umbraco site, resized images are made on demand: a URL such as `/media/abc/photo.jpg?width=800&height=450` makes Umbraco resize the picture when it's requested. A static site has no Umbraco to do that, so xStatic makes the resized copies in advance. This page explains how to list the sizes you need, how the files are named and how your templates should ask for them.

## At a glance

1. Add the sizes to the site's **Image Crops** field, for example `1600x900@80,800x450,320x0`.
2. In your Razor templates, ask Umbraco for the same sizes (`GetCropUrl(width: 800, height: 450)`).
3. **Generate**. xStatic saves each size next to the original and rewrites the image URLs in your HTML to point at the saved files.

## Crop syntax

Each entry is `{width}x{height}`, with an optional `@{quality}`. Add them as separate tags in **Image Crops** on the site (the box saves them as a comma-separated list).

| Entry | Meaning |
|-------|---------|
| `800x450` | Fit within 800 by 450 pixels |
| `320x0` | 320 pixels wide, height worked out from the picture's shape |
| `0x200` | 200 pixels high, width worked out |
| `1600x900@80` | 1600 by 900, with quality 80 |

- Use `0` for a dimension you don't want to fix.
- The size is a box: the image is scaled to fit inside it and keeps its shape. It isn't cut to size.
- `@80` is the compression quality as a percentage. Leave it off, or use `0`, to keep Umbraco's default.
- The letter must be a lower case `x`.
- An entry that can't be understood is skipped without a warning, for example `800` (no `x`), `800x450x20` (too many parts) or `800x450@80@10`. If a crop is missing from the output, check the spelling first.

xStatic only resizes `jpg`, `jpeg`, `png`, `gif` and `webp` files. Other media are copied unchanged.

## What gets made

Crops are made for images in the site's **Media Root Nodes**, as part of **Generate**. Each image is saved once as the original and then once per crop, in the same folder.

For the `300x200` crop and an image at `/media/abc123/photo.jpg`:

```text
media/abc123/photo.jpg
media/abc123/photo--300x200.jpg
```

The name is `{original name}--{width}x{height}{extension}`. A dimension you left out or set to `0` appears as `0`, so `320x0` makes `photo--320x0.jpg`.

Quality isn't part of the name, so `800x450@80` and `800x450@50` both produce `photo--800x450.jpg` and the second overwrites the first. Use one quality for each size.

The naming comes from `IImageCropNameGenerator`. You can replace it ([File name generators](File-Name-Generators.md)), but the default HTML transformer list always uses the default naming.

## Use the same sizes in your templates

The pages xStatic downloads are your normal Razor pages, so they link to resized images the way Umbraco does. The **CroppedImageUrlTransformer** then looks in the HTML for media URLs whose query string has the same `width` and `height` as one of your crops, and changes the file name to the crop's file name. It works in attributes such as `src` and `href`, and in CSS `url(...)`.

Before:

```html
<img src="/media/abc123/photo.jpg?width=800&height=450&rmode=max&hmac=...">
```

After:

```html
<img src="/media/abc123/photo--800x450.jpg?width=800&height=450&rmode=max&hmac=...">
```

The query string stays on the URL (the exact parameters depend on your Umbraco version and how you build the URL). A static host ignores it and serves the file.

To make this match, ask for exactly the sizes you listed. In a template:

```cshtml
@using Umbraco.Cms.Core.Models

<img src="@Model.Image.GetCropUrl(width: 800, height: 450, imageCropMode: ImageCropMode.Max)" alt="">
```

- **Match the crop mode.** xStatic makes its copies with the `Max` mode (fit inside the box). Umbraco's default, when you give both a width and a height, crops the picture to fill the box instead. Pass `imageCropMode: ImageCropMode.Max` as above if you want the static copy to look like the live site. Without it the URL still matches and is rewritten, but it points at the fit-inside copy.
- **For a crop with a `0`, pass the `0` too** (`width: 320, height: 0`). If you leave `height` out, the URL has no `height=` and isn't rewritten.

Check the generated HTML after the first build to confirm the URLs were rewritten.

Things the match doesn't do:

- It only looks at URLs that start with `/media/`.
- It compares `width` and `height` only, not quality, and it matches the start of the number (`width=300` also matches `width=3000`). Avoid listing sizes where one starts with the other.
- It works on one line of HTML at a time, from the first `/media/` URL on the line to the last quote or bracket on it. If a line holds several media URLs (minified HTML, a `srcset`, or a link to a PDF next to an image), only the first URL is looked at. Images after it aren't rewritten, and if the first URL isn't the cropped image it can be renamed wrongly. Check the output for such pages, and avoid minifying the HTML you generate from.
- A URL with a size that isn't in your list is left alone. The page then points at a file that doesn't exist, so a missing crop shows up as a broken image.

This rewriting is part of the default HTML export type. A [custom export type](Export-Types.md) only does it if its transformer list includes `CroppedImageUrlTransformer`. JSON exports don't rewrite image URLs.

## Signed URLs and the HMAC key

New Umbraco installs set `Umbraco:CMS:Imaging:HMACSecretKey`. When it's set, Umbraco's image middleware only accepts resize URLs that carry a valid `hmac` signature, and answers anything else with a 400 error.

xStatic builds each crop URL with Umbraco's own `IImageUrlGenerator`, which adds the signature for you. You don't need to configure anything in xStatic. Your appsettings only needs the key you already have:

```json
{
  "Umbraco": {
    "CMS": {
      "Imaging": {
        "HMACSecretKey": "YOUR-SECRET-KEY"
      }
    }
  }
}
```

Versions before 17.3.0 / 18.0.0 sent unsigned URLs, so on an install with a key no crop files were written. If the generator can't be found, xStatic falls back to an unsigned URL, which only works when no key is set.

The server has to be able to download its own resized images. If crops fail but pages work, see the warnings below.

## When a crop fails

xStatic reports it as a warning on the media item and still keeps the original:

```text
/media/abc123/photo.jpg: Saved the original, but could not download these crops: photo--800x450.jpg. Check the log for details.
```

You'll see it, one line per problem, in the **Site generated with N problem(s)** toast ([Generating and deploying](Generating-and-Deploying.md#results-and-warnings)). The Umbraco log has the HTTP error for each one. Usual causes:

- An HMAC key is set and the site is on a version before 17.3.0 / 18.0.0, which sent unsigned URLs.
- The server can't reach its own URL, or doesn't trust its certificate ([TrustSslWhenGenerating](Configuration.md#trustsslwhengenerating)).
- The image file is damaged or unsupported by Umbraco's image processing.

Crop files from earlier runs stay in the output until you **Clean** ([Stale files](Generating-and-Deploying.md#stale-files)).

## Next steps

- [Sites](Sites.md)
- [Asset paths](Asset-Paths.md)
- [Configuration](Configuration.md)
- [Troubleshooting](Troubleshooting.md)
