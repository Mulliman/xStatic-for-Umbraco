xStatic has a small set of global settings. Most things you'd want to change, such as sites, deployment targets and actions, are set in the backoffice instead and are stored in the database. This page lists the global settings, how to set them in `appsettings.json` or in code, and the Umbraco settings that affect xStatic.

## At a glance

All settings are optional. xStatic works with none of them. They live in an `XStatic` section of `appsettings.json`:

```json
{
  "XStatic": {
    "TrustSslWhenGenerating": false,
    "ExcludeGeneratingDocTypes": [ "redirectPage" ],
    "DoNotDeletePaths": [ ".git", "CNAME", ".well-known" ]
  }
}
```

| Setting | Default | What it does |
|---------|---------|--------------|
| [`TrustSslWhenGenerating`](#trustsslwhengenerating) | `false` | Accept any SSL certificate when xStatic downloads pages and crops from your site |
| [`ExcludeGeneratingDocTypes`](#excludegeneratingdoctypes) | none | Document type aliases whose pages aren't generated |
| [`DoNotDeletePaths`](#donotdeletepaths) | `.git`, `CNAME` | Files and folders kept when you select **Clean** |
| [`EnableRelationBasedAutoPublish`](#relation-based-auto-publish) | `false` | Walk upstream Umbraco document relations during auto publish so shared content triggers referencing sites |
| [`AutoPublishMaxRelationDepth`](#relation-based-auto-publish) | `5` | Maximum upstream relation traversal depth for relation-based auto publish |
| [`AutoPublishGlobalContentTypes`](#relation-based-auto-publish) | none | Document type aliases whose publication rebuilds all auto-publish sites when relation-based auto publish is enabled |
| [`Secrets:AllowedEnvironmentVariables`](#secrets) | `XSTATIC_*` | Environment variables that `${env:NAME}` references in deployment targets and actions may read |
| [`Secrets:AllowedConfigurationKeys`](#secrets) | `XStatic:Secrets:*` | Configuration keys that `${config:Key}` references may read |
| [`UseXStaticUserRoles`, `RoleCreationUser`, `RoleCreationUseRootUser`](#user-group-settings) | Set by xStatic | Control the xStatic user groups |

The settings are bound to [XStaticGlobalSettings](../Source/XStaticCore/XStatic.Core/App/XStaticGlobalSettings.cs) and read through `IOptions<XStaticGlobalSettings>`. They're read when the site starts, so restart the site after you change them. There are no settings for the output folder, timeouts or languages.

Standard .NET configuration rules apply, so you can set them in environment variables too, for example `XStatic__TrustSslWhenGenerating=true` or `XStatic__DoNotDeletePaths__0=CNAME`.

## The settings

### TrustSslWhenGenerating

When `true`, xStatic accepts any SSL certificate while it downloads pages and image crops from your own site. This turns off certificate checking completely (self-signed, wrong host name, expired), but only for xStatic's page downloads. Deployers aren't affected.

Use it when the server doesn't trust the certificate that your site presents to itself. The usual case is a development certificate on Linux or macOS. If pages fail with "Could not download the page", this is a likely cause ([Generating and deploying](Generating-and-Deploying.md#results-and-warnings)). Don't leave it on in production if you don't need it.

The setting is read when the generator is first created, so a restart is needed for a change to take effect.

### ExcludeGeneratingDocTypes

A list of document type **aliases** (matched case-sensitively). Pages of these types are not generated:

```json
{ "XStatic": { "ExcludeGeneratingDocTypes": [ "redirectPage", "formConfirmation" ] } }
```

Things to know:

- It leaves out the pages of those types only. The **child pages of an excluded page are still generated**, so excluding a "section" type doesn't remove its contents.
- It applies to every site, not one site.
- The site's root page is always included.
- xStatic writes the excluded aliases to the log at information level when a build starts.

### DoNotDeletePaths

Files and folders to keep when you select **Clean** on a site ([Generating and deploying](Generating-and-Deploying.md#clean)):

```json
{ "XStatic": { "DoNotDeletePaths": [ ".git", "CNAME", ".well-known" ] } }
```

- **A path is kept when it ends with one of these values**, ignoring case. `CNAME` therefore also keeps a file called `xCNAME`.
- Only the top level of the site's output folder is checked. You can keep `.well-known`, but you can't keep a single file inside a folder that is otherwise deleted.
- A kept folder keeps everything inside it.
- **Setting this list replaces the defaults.** The defaults are `.git` and `CNAME`, so include them if you still want them. An empty list, or one with only blank entries, means "use the defaults". It can't be used to switch protection off.

Before xStatic 17.3.0 / 18.0.0 this was read from `xStatic.DoNotDeletePaths` in the .NET Framework `app.config`, which modern Umbraco sites don't have, so it never took effect. If you set it that way, move the value to `XStatic:DoNotDeletePaths`.

### Relation-based auto publish

`EnableRelationBasedAutoPublish`, `AutoPublishMaxRelationDepth` and `AutoPublishGlobalContentTypes` let [Auto publish](Auto-Publish.md#shared-content-and-relation-based-auto-publish) rebuild sites when shared content outside a site's root tree is published:

```json
{
  "XStatic": {
    "EnableRelationBasedAutoPublish": true,
    "AutoPublishMaxRelationDepth": 5,
    "AutoPublishGlobalContentTypes": [ "globalNavigation", "sharedFooter" ]
  }
}
```

### Secrets

`Secrets:AllowedEnvironmentVariables` and `Secrets:AllowedConfigurationKeys` decide which values
[secret references](Secrets-and-Environment-Variables.md) such as `${env:XSTATIC_NETLIFY_TOKEN}` may read:

```json
{
  "XStatic": {
    "Secrets": {
      "AllowedEnvironmentVariables": [ "XSTATIC_*", "NETLIFY_AUTH_TOKEN" ],
      "AllowedConfigurationKeys": [ "XStatic:Secrets:*" ]
    }
  }
}
```

- Patterns use `*` and `?` and ignore case. `"*"` allows everything.
- **Setting a list replaces its default**, so include `XSTATIC_*` or `XStatic:Secrets:*` if you still want them. An
  empty list means "use the default".
- The defaults are deliberately narrow, because anyone who can edit a deployment target can send any allowed value to
  a server they choose. See [Which variables xStatic can read](Secrets-and-Environment-Variables.md#which-variables-xstatic-can-read).

### User group settings

`UseXStaticUserRoles`, `RoleCreationUser` and `RoleCreationUseRootUser` control the `xStaticAdmin` and `xStaticNormalUser` groups ([User groups and security](User-Groups-and-Security.md)). You don't normally set these in `appsettings.json`: the automatic set-up turns them on in code, and values set in code win over the file (see below). To change them, [register xStatic yourself](Extending-xStatic.md) and either call `UseSecureUserGroups` or set the values in `appsettings.json`.

Setting `RoleCreationUser` in `appsettings.json` has no effect under the automatic registration, because that turns on `RoleCreationUseRootUser` and the root user wins. To give the groups to a different user, register xStatic yourself and call `UseSecureUserGroups("user@example.com")`, or set `UseXStaticUserRoles` and `RoleCreationUser` without `RoleCreationUseRootUser`.

## Setting them in code

If you register xStatic yourself (see [Extending xStatic](Extending-xStatic.md)), the builder has a method for each setting:

```csharp
using System.Collections.Generic;
using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .UseSecureUserGroups()
    .TrustUnsafeSslConnectionWhenGenerating()
    .ExcludeGeneratingDocTypes(new List<string> { "redirectPage" })
    .DoNotDeletePathsWhenClearing(".git", "CNAME", ".well-known")
    .Build();
```

| Builder method | Sets |
|----------------|------|
| `TrustUnsafeSslConnectionWhenGenerating()` | `TrustSslWhenGenerating = true` |
| `ExcludeGeneratingDocTypes(IList<string>)` | `ExcludeGeneratingDocTypes` |
| `DoNotDeletePathsWhenClearing(params string[])` | `DoNotDeletePaths` |
| `AllowSecretEnvironmentVariables(params string[])` | `Secrets.AllowedEnvironmentVariables` |
| `AllowSecretConfigurationKeys(params string[])` | `Secrets.AllowedConfigurationKeys` |
| `UseSecureUserGroups()` | `UseXStaticUserRoles = true` and `RoleCreationUseRootUser = true`. The built-in root user creates the groups and is added to them |
| `UseSecureUserGroups(string user)` | `UseXStaticUserRoles = true` and `RoleCreationUser = user` (the user name, which is usually an email address) |

`Automatic()` registers everything else with its defaults. `AutomaticWithSingleSiteOutput(string outputFolderName)` is the alternative that writes every site to one folder ([Site storers](Site-Storers.md)).

The builder is in [XStaticApp.cs](../Source/XStaticCore/XStatic.Core/App/XStaticApp.cs).

When you don't register anything yourself, the `XStaticComposer` does the equivalent of `AddXStatic().Automatic().UseSecureUserGroups().Build()`. It stands back if it finds that your code has already registered `ISitesRepository`.

### Which wins

1. `appsettings.json` (and environment variables and other configuration sources) is bound first. That happens whether or not you register xStatic yourself.
2. Anything set through the builder is applied afterwards, so **values set in code win**. This is also why the automatic set-up always turns the user roles on.
3. The list settings are replaced, not merged. `ExcludeGeneratingDocTypes(...)` in code replaces any list from `appsettings.json`.

## Umbraco settings that matter

| Setting | Why it matters |
|---------|----------------|
| `Umbraco:CMS:Imaging:HMACSecretKey` | New installs have one. Image crops need Umbraco's signed resize URLs, which xStatic 17.3.0 / 18.0.0 and later produce for you ([Image crops](Image-Crops.md#signed-urls-and-the-hmac-key)) |
| **Culture and Hostnames** on content | The domains set here decide each page's URL and are what **Target Hostname** replaces ([Multi-language sites](Multi-Language-Sites.md#hostnames)) |
| Your site's URLs | xStatic fetches every page with an HTTP request to the URL Umbraco reports for it, so the server must be able to reach those URLs. If it can't, pages fail with "Could not download the page" |

## Next steps

- [Extending xStatic](Extending-xStatic.md) for registering xStatic by hand
- [User groups and security](User-Groups-and-Security.md)
- [Generating and deploying](Generating-and-Deploying.md)
