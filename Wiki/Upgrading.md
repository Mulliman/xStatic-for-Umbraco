How to move an existing xStatic site to a newer version, with notes for each major version from 13 to 18. Start with
[the general steps](#general-upgrade-steps), then read the section for each major version you are crossing.

## At a glance

| Coming from | Going to | Main things to do |
|-------------|----------|-------------------|
| 13 | 17 or 18 | Update packages. xStatic copies your sites across automatically on first start. Check each site's deployment target. Drop the old table. See [v13 to 14 and later](#v13-to-14-and-later) |
| 14 | 15 | Update packages. Nothing else |
| 15 | 17 | Update packages (.NET 10). Remove `xStatic.UmbracoContentApi` if you have it |
| 17 | 18 | Update packages (Umbraco 18.3.2 or later). Read [what 18.0.0 reports that was silent before](#behaviour-changes-in-1800) |
| 16 | | There is no stable 16 release. Go from 15 straight to 17 |

xStatic has one branch and one major version per Umbraco major version. The [Home](Home.md) page lists which
versions are supported.

## General upgrade steps

These apply to every upgrade.

1. **Back up your database** and your `umbraco/Data/xStatic/output` folder if you keep anything in it you can't regenerate.
2. **Upgrade Umbraco first, or together with xStatic.** Each xStatic major version is built for one Umbraco major
   version. The minimum Umbraco version is the one xStatic was built against: for 18.0.0 that is **Umbraco 18.3.2**.
3. **Update every xStatic package together, to the same version.** The packages are released as a set, so don't mix versions:
   - `xStatic` (required, it brings in `xStatic.Core` and `xStatic.Client`)
   - `xStatic.Netlify`, `xStatic.Git`, `xStatic.Ftp` (only the deployers you use)
   - `xStatic.RemoteOperations` (only if you use [Remote operations](Remote-Operations.md))

   ```powershell
   dotnet add package xStatic --version 18.0.0
   dotnet add package xStatic.Netlify --version 18.0.0
   ```

   Until 18.0.0 is released, only `18.0.0-beta` exists, so use `--version 18.0.0-beta` (or add `--prerelease`).

4. **Remove any `xStatic` registration code you no longer need.** Since 14.1.0 `XStaticComposer` registers xStatic
   for you; see [Registration code](#registration-code-startupcs-and-programcs).
5. **Start the site.** xStatic runs its database migrations on start, so there is nothing to run by hand.
6. **Open the xStatic section in the backoffice** and check **Sites**, **Deployment Targets**, **Actions** and
   **Export Types**. Then run **Generate** on one site and look at the result list (see
   [Generating and deploying](Generating-and-Deploying.md)).
7. **Hard-refresh the browser** (Ctrl+F5) if the backoffice looks wrong. Umbraco caches the package's JavaScript.

If you have your own deployers, transformers or actions, rebuild them against the new `xStatic.Core` version. The
public API is only changed in major versions, but a new Umbraco major version can break your own code on its own.

## Registration code (Startup.cs and Program.cs)

Older versions asked you to register xStatic in `Startup.cs` (`ConfigureServices`) or later `Program.cs`.
**From 14.1.0 you don't need any code.** `XStaticComposer` runs `AddXStatic().Automatic().UseSecureUserGroups().Build()`
for you, unless your site has already registered `ISitesRepository`. That check is how you opt out and
configure xStatic yourself; see [Extending xStatic](Extending-xStatic.md).

If your site still calls `AddXStatic()` and you didn't mean to opt out, delete that code. The
[Get Started video](Videos-and-Talks.md) shows the `Program.cs` step, which is no longer needed.

## v13 to 14 and later

Umbraco 14 replaced the AngularJS backoffice with a Lit-based one, and xStatic was rebuilt on top of it. The
data model changed too. For a long time moving a site from 13 to a later version didn't carry your site
configuration across. **From 17.3.0 and 18.0.0 xStatic does it for you.**

If you are on 13 and want to go straight to 18, do the Umbraco upgrade first (13 to 18 is an Umbraco task, so follow
Umbraco's own upgrade guidance), add the 18.0.0 xStatic packages and start the site.

### What the automatic upgrade does

The step is `MigrationUpgradeV13SiteConfigs` in
[XStaticDatabaseMigrationPlan.cs](../Source/XStaticCore/XStatic/Db/XStaticDatabaseMigrationPlan.cs). The conversion
logic is in [V13SiteConfigConverter.cs](../Source/XStaticCore/XStatic.Core/Generator/Db/Legacy/V13SiteConfigConverter.cs).
On first start it:

1. Creates the new `XStaticSiteConfigs14Plus` and `XStaticDeploymentTargets` tables if they are missing.
2. Copies the sites from the old `XStaticSiteConfigs` table, **but only if the new table is empty**. A database that
   already has v14+ sites is left alone.
3. Converts the root content node and the media root nodes from integer ids to Umbraco keys (Guids). A media root that
   no longer exists is dropped.
4. **Skips a site whose root content node no longer exists**, and logs a warning naming it.
5. Turns the deployer that was stored inline on each v13 site into a standalone **deployment target** called
   `<site name> (<deployer name>)`, and renames the built-in deployers' field names to the current ones (for example
   FTP `Username` becomes `FTP.Uname`, Netlify `PersonalAccessToken` becomes `Netlify.PAT`). Custom deployers' fields
   are copied unchanged. A site with no deployer, or one whose stored deployer settings can't be read, is copied with no
   deployment target and no warning naming it, so pick one for it.
6. On SQL Server, if the new sites table already existed, widens its `MediaRootNodes` column to 4000 characters so that
   more than six media roots fit. SQLite doesn't need it.
7. **Leaves the old table in place** and logs a warning.

Your export types, actions and the other site settings (asset paths, image crops, hostname, post-generation actions,
auto publish) are carried across as they are. Culture settings start empty, because v13 had no per-site cultures.

### What to check afterwards

1. Look at the application log for lines starting `xStatic: upgraded`. It tells you how many of your sites were
   copied, and names any that were skipped.
2. Open each site and check its **deployment target**. The built-in deployers are mapped for you, but a custom
   deployer's target needs a look, and the log says to check them all.
3. If you use more than one language, set the site's cultures. See [Multi-language sites](Multi-Language-Sites.md).
4. Run **Generate** and **Deploy** once per site.

### Dropping the old table

The old `XStaticSiteConfigs` table holds your deployer credentials (FTP passwords, Git and Netlify tokens) in plain
text. xStatic never deletes it, so once you are happy with the upgrade, drop it yourself:

```sql
DROP TABLE XStaticSiteConfigs;
```

Don't do this until you have checked every site. It is the only copy of the old settings.

### Other changes between 13 and 14

- The backoffice sections are new: Sites, Export Types, Actions, Deployment Targets, Config and Documentation. See
  [Backoffice tour](Backoffice-Tour.md).
- Deployment targets are their own thing, shared between sites, instead of being typed into each site.
- Two user groups, `xStaticAdmin` and `xStaticNormalUser`, control access. See
  [User groups and security](User-Groups-and-Security.md).
- Multi-language sites are supported. See [Multi-language sites](Multi-Language-Sites.md).
- **If you wrote plugins:** the public API changed. `IDeployerDefinition.Fields` is now `IEnumerable<DeployerField>`
  (it was `IEnumerable<string>`), `ISiteConfig.RootNode` is a `Guid`, `ISiteConfig.GetDeploymentTarget()` is gone,
  `ISiteConfig.Cultures` was added, and `IGenerator.GeneratePage` has a trailing `string culture = null` parameter.
  Deployer field aliases are namespaced, such as `FTP.Hostname`. See [Writing a deployer](Writing-a-Deployer.md).
- Since 14.2.0, the package's own file and folder names (including `App_Plugins/xstatic14`) are all lower case, so they work on Linux and macOS.

## v14 to 15

Umbraco 15 and .NET 9. Update the packages. Nothing in your data changes.

- New optional package `xStatic.RemoteOperations` for triggering xStatic from outside. See
  [Remote operations](Remote-Operations.md).
- 15.1.0 added a custom output folder name and single-site output. See [Site storers](Site-Storers.md).

## v15 to 17

There is no stable 16 release (only 16.0.0 alphas), so go from 15 to 17. Umbraco 17 needs .NET 10.

- Update the packages. Your data is kept.
- **Remove `xStatic.UmbracoContentApi` if you have it installed.** See [below](#xstaticumbracocontentapi-is-retired).
- The generated output is stored in `umbraco/Data/xStatic/output/<site id>`. It was in `App_Data` in the oldest versions.
- 17.1.0 uses async file access and parameterised SQL. Pages are still generated one at a time: parallel generation was tried during 17.1.0 and taken out again.
- 17.2.0 added the **exclude document types** setting. See [Configuration](Configuration.md).

## v17 to 18

Umbraco 18 and .NET 10 (the same .NET as 17). **You need Umbraco 18.3.2 or later.**

1. Update Umbraco, then update all xStatic packages to 18.0.0.
2. Remove `xStatic.UmbracoContentApi` if you have it.
3. If you set `xStatic.DoNotDeletePaths` in an old `app.config`, move it. See
   [DoNotDeletePaths](#donotdeletepaths-moved-to-appsettings).
4. Run **Generate** on each site and read the results. 18.0.0 reports problems that were silent before, so a site
   that looked fine may now show warnings. See [Behaviour changes in 18.0.0](#behaviour-changes-in-1800).

## Changes that need action

### xStatic.UmbracoContentApi is retired

`xStatic.UmbracoContentApi` (an older package that exposed content over an API for JSON export) has been removed from
the repository and is no longer published. It depends on a library built for Umbraco 9 that uses `IMacroRenderer`,
which Umbraco removed in version 14, so a site with the package installed fails at startup on version 17.0.0 and later.

To upgrade, uninstall the package from your site. If you used it for headless JSON, use the built-in JSON export type
instead; see [JSON export](JSON-Export.md).

### DoNotDeletePaths moved to appsettings

When you **Clean** a site's output, xStatic keeps some files, by default `.git` and `CNAME`. The setting that controls
this used to be read from `xStatic.DoNotDeletePaths` in `web.config` or `app.config`, which modern Umbraco sites don't
read, so it never took effect. It now lives in `appsettings.json`:

```json
{
  "XStatic": {
    "DoNotDeletePaths": [ ".git", "CNAME", ".well-known" ]
  }
}
```

A list **replaces** the defaults, so include `.git` and `CNAME` again if you still need them. A path is kept when it
ends with one of the values. See [Configuration](Configuration.md) and
[FileHelpers.cs](../Source/XStaticCore/XStatic.Core/Helpers/FileHelpers.cs).

### Trust SSL setting

If you trusted self-signed certificates with an old code or app setting, use `XStatic:TrustSslWhenGenerating` in
`appsettings.json` (available since 17.1.0; from 14.2.0 to 17.0 it can only be set in code with
`TrustUnsafeSslConnectionWhenGenerating()`). See [Configuration](Configuration.md).

### RebuildProcess needs an IEntityService

This only matters if your own code creates `RebuildProcess` with `new`. In 17.3.1 xStatic added a constructor that
takes an `IEntityService`, which it uses to list the media under each media root from the database. That fixes media
missing on a new site's first boot. The old constructor without it was marked obsolete, and 18.0.0 removes it.

Add `IEntityService` to your class's constructor (it's registered in every Umbraco site) and pass it as the last
argument. The example in [Architecture](Architecture.md#the-generate-pipeline) shows the full call.

## Behaviour changes in 18.0.0

These changes are also in 17.3.0, so they apply if you move to that release too.

Several failures used to be silent. They are now reported, so a site that used to look "green" can show warnings or be
marked unsuccessful after the upgrade. That is the code telling you about something that was already wrong. Read the
result list after your first **Generate** and **Deploy**.

| Used to happen | Now |
|----------------|-----|
| A page that couldn't be downloaded (site down, 404, 500, certificate error) was saved as an empty file | It is an error naming the URL. Nothing is stored for that page, and other pages carry on |
| A post-generation action that returned an error was shown as "Completed" | It is shown as a warning with its message, and the run is unsuccessful. Every action still runs |
| A missing asset path stopped generation | It is skipped, logged and reported as a failed "Asset" result. Other pages still generate. See [Asset paths](Asset-Paths.md) |
| Deploy before generate gave an unhelpful error | It names the folder and tells you to generate first |
| FTP deploys said they succeeded when no files were uploaded (blocked passive ports) | The deploy fails and points at passive mode and the firewall. Existing files are now overwritten, so edited pages no longer stay stale. See [Deploying to FTP](Deploying-to-FTP.md) |
| A failed first Git clone left the site stranded in a `_temp` folder, which the next deploy deleted | The site is moved back before the error is reported. See [Deploying with Git](Deploying-with-Git.md) |
| Image crop URLs were unsigned, so on installs with an Umbraco HMAC key (new installs have one) they got a 400 and no crops were written | Crop URLs come from Umbraco's image URL generator, and a media item whose crops fail is reported. See [Image crops](Image-Crops.md) |
| Generated files were UTF-8 with a byte order mark, so JSON exports failed strict parsers | Files are UTF-8 without a BOM. A file-by-file diff against old output shows a change at the start of each file |
| Action results used the action type name | They use the name you gave the action |
| `DoNotDeletePaths` never took effect | It works, from `appsettings.json` |

Other changes in 18.0.0:

- Built on Umbraco 18.3.2, which includes security fixes. All xStatic dependencies were refreshed.
- The FTP deployer uses FluentFTP 55, and the Git deployer LibGit2Sharp 0.32.
- Sites upgraded from xStatic 13 now load (the Sites dashboard returned an HTTP 500 before 17.3.0).

The full list is on [Version history](Version-History.md#whats-new-in-1800).

## Next steps

- [Troubleshooting](Troubleshooting.md) if something doesn't work after upgrading
- [Version history](Version-History.md) for every release
- [Configuration](Configuration.md) for the `XStatic` appsettings section
