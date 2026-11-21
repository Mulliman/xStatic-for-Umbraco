If your Umbraco site has more than one language, xStatic can generate every language into the same static site. This page covers the Umbraco setup that has to be in place, the **Cultures** setting on the xStatic site, how the files are laid out and how to send visitors from the site root to a default language.

A video shows the whole process, including hosting: [Create and host multi-language sites](https://www.youtube.com/watch?v=gQRVHEK0cSc).

## At a glance

1. Set up your languages and domains in Umbraco as you would for a live multi-language site.
2. On the xStatic site, tick the languages you want under **Cultures**.
3. Generate. Each page is generated once per ticked language, into the folders Umbraco's URLs describe (for example `en/about/index.html` and `fr/about/index.html`).
4. Add a post-generation action to copy the default language's home page to the root, so `/` works.

xStatic doesn't do any translation or language logic of its own. It asks Umbraco for each page's URL in each language and saves what comes back.

## Set up Umbraco

These steps are normal Umbraco multi-language set-up. Umbraco's own documentation has the full detail.

1. **Add the languages.** In **Settings**, open **Languages** and add each one. Mark one as the default.
2. **Allow variation by culture.** On each document type that has translated content, turn on **Allow vary by culture**, and turn it on for each property that differs between languages.
3. **Set up domains.** On the site's root content item, open **Culture and Hostnames** and add a domain for each language. Using a path per language, for example `example.com/en` and `example.com/fr`, gives you folders like `en/` and `fr/` in the output.
4. **Write and publish** the content in every language. A page is only generated for a language it's published in.

Check the result in the browser before involving xStatic. If `/en/about/` and `/fr/about/` don't work on your Umbraco site, they won't work in the static site either.

## Choose the languages on the xStatic site

1. In the **xStatic Sites** tab, edit the site.
2. Under **Cultures**, tick each language to include ("Choose which language variant(s) should be used. Leave blank to use the default language.").
3. Select **Submit**, then **Generate**.

The list shows the languages defined in Umbraco, up to 100. Once saved, the site card shows the choice as `Cultures: en-US | fr-FR`.

If you tick nothing, xStatic generates the site once, without asking for a particular language, as it does for a single-language site.

What changes when you tick more than one:

- Every page is requested once per language, so generating takes roughly that many times longer.
- **Media, crops and asset paths are not repeated.** They don't depend on language and are copied once.
- With HTML export, a page with no URL in a language, for example one that isn't published in it, is reported as a failed page for that language and the rest carry on ([Generating and deploying](Generating-and-Deploying.md#results-and-warnings)).
- The selection is stored as a short list of language codes (200 characters on SQL Server), which is plenty for normal use.

## Folder layout

The folders come from the URLs Umbraco gives each page in each language, passed through the export type's file name generator. With the default HTML export, `/en/about/` is saved as `en/about/index.html`:

```text
index.html                (see "Send the root to a language" below)
en/index.html
en/about/index.html
fr/index.html
fr/about/index.html
media/...
css/...
```

If your default language has a domain with no path, its pages sit at the top level (`about/index.html`) and only the other languages get a folder. The layout always follows your Culture and Hostnames set-up, so the quickest check is to generate once and select **Download** to look in the zip.

## Send the root to a language

When every language has its own folder, nothing exists at `/` and a visitor to your domain sees an error. The simple fix is to copy the default language's home page to the root with a [post-generation action](Post-Generation-Actions.md):

| Setting | Value |
|---------|-------|
| **Action Type** | `FileCopyAction` |
| **FilePath** | `/en/index.html` |
| **NewFilePath** | `index.html` |

Add it to the site under **Post Generation Actions**. Use the path your own build produces. The copy is a plain copy, so it's the same page as `/en/`, and links on it point to the language folders. You can't pick the language from the visitor's browser settings: that would take JavaScript or a redirect rule at your host.

## Hostnames

The **Target Hostname** field on a site swaps your working domain for the live one in the generated pages. It does this by replacing every domain listed in **Culture and Hostnames** (on any site in your Umbraco, not only this one) with the target hostname, exactly as the domain is written there, including any path.

This matters most if your domains include a path, such as `example.com/en`. In that case the whole string is replaced, path included. Most Razor templates write relative links such as `/en/about/`, which aren't affected, but check any absolute links in the output.

See [Sites](Sites.md) for the field itself.

## Limitations

- **JSON export content isn't translated.** With the [JSON export](JSON-Export.md), the language only decides the file path. The language isn't passed on when the properties are read, so don't expect translated values in each file. The JSON generator also doesn't check that a page has a URL in each language, so look through the output for odd file names such as `#.json`.
- Languages have to exist as Umbraco languages. You can't type a code that Umbraco doesn't know.
- Sites created before xStatic 14 had no language setting. A site upgraded from xStatic 13 starts with none selected.

## Next steps

- [Post-generation actions](Post-Generation-Actions.md)
- [Sites](Sites.md)
- [Generating and deploying](Generating-and-Deploying.md)
- [Videos and talks](Videos-and-Talks.md)
