Short answers to the questions people ask most, whether you're deciding if xStatic suits your project or you've already installed it. Each answer links to the page with the detail. If your question is about something that isn't working, go to [Troubleshooting](Troubleshooting.md).

## Is xStatic for me?

### Is xStatic free? What licence is it under?

Yes. xStatic and all its packages are free and open source under the MIT licence, and the Umbraco Marketplace lists it as free. You pay only for wherever you host the result ([What is xStatic?](What-is-xStatic.md#packages)).

### Which Umbraco versions does it support?

Each xStatic major version matches one Umbraco major version: 18.x for Umbraco 18 (needs 18.3.2 or later), 17.x for Umbraco 17, and 13.x for Umbraco 13, with older 14 and 15 releases no longer updated. Versions before 13 aren't supported. See the table on [Home](Home.md#versions) and [Upgrading](Upgrading.md).

### Does my site need to be built with Razor templates?

Yes, for HTML export. xStatic downloads each published page over HTTP from your running site, so it needs server-rendered pages. A site that is only a JavaScript app calling an API has nothing to download. For that style, use the [JSON export](JSON-Export.md), which reads content directly and doesn't need templates ([What it can't do](What-is-xStatic.md#what-it-cant-do)).

### Can a static site have forms, search or member logins?

Not on its own. A static site is a set of files, so anything that needs the server to act on each visit (saving a form, querying Examine, checking who is logged in) won't work from the files alone. You can replace forms and search with third-party services and JavaScript, but that is your own build work. You can also write a transformer that swaps forms for a notice, as in the [static failover recipe](Static-Failover-Site.md) and [Writing a transformer](Writing-a-Transformer.md).

### Is it a good fit for a big or frequently changing site?

It suits mostly-content sites best. Every build regenerates the whole site, so very large sites build slowly, and sites whose pages change per visitor or per minute aren't a good match. For a busy editorial team, a scheduled build is usually kinder than rebuilding on every publish ([Auto publish](Auto-Publish.md#what-to-know-before-you-switch-it-on)).

## Hosting and deploying

### Where can I host the generated site?

Anywhere that serves files. xStatic can deploy directly to [Netlify](Deploying-to-Netlify.md), to a [Git repository](Deploying-with-Git.md), to an [FTP server](Deploying-to-FTP.md) or to [a folder](Deploying-to-a-Folder.md). Because the output is plain files, you can also host it from a Git repository on any host that builds from Git, or download the zip and upload it yourself.

### Can I use GitHub Pages?

Yes, through the Git deployer, which has a full [GitHub Pages walkthrough](Deploying-with-Git.md#walkthrough-github-pages). Use a custom domain or a `<your-name>.github.io` repository: a project site under a sub-path such as `you.github.io/my-repo/` breaks root-relative links unless you add a transformer ([Hosting under a sub-path](Deploying-with-Git.md#hosting-under-a-sub-path)).

### Can I deploy to AWS S3 or another host that isn't listed?

For S3 there's a community plugin, `xStatic.AWSS3` by Adam Werner, which deploys to an S3 bucket ([NuGet](https://www.nuget.org/packages/xStatic.AWSS3), [GitHub](https://github.com/adam-werner/xStatic.AWSS3)). It's a separate package that isn't maintained in this repository, so check it suits your versions. It's also listed on the **Documentation** dashboard in the backoffice ([Backoffice tour](Backoffice-Tour.md#documentation)). For anything else, you can write your own deployer ([Writing a deployer](Writing-a-Deployer.md)), or deploy to a folder and sync it with another tool.

### Does xStatic delete files at the destination?

It depends on the deployer. **Netlify** removes files that are no longer in the output, **Git** stages deletions, **FTP** mirrors and deletes anything on the server that isn't in the site, and **File System** never deletes. xStatic itself never empties its output folder when you generate: only **Clean** does. See [Troubleshooting](Troubleshooting.md#old-or-deleted-pages-are-still-on-the-live-site) and read the [FTP mirror warning](Deploying-to-FTP.md#mirror-mode-deletes-files) before you point it at a real server.

### Where are the generated files stored?

On the Umbraco server, under the site's content root at `umbraco/Data/xStatic/output/{site id}`, with a separate folder for each site. There's no setting in the backoffice or `appsettings.json` for the location (a code option writes every site to one named folder, see [Site storers](Site-Storers.md)). Select **Download** on a site card to get the folder as a zip ([Where the files go](Generating-and-Deploying.md#where-the-files-go)).

### Can I use xStatic on Umbraco Cloud?

It hasn't been tested or documented for Umbraco Cloud, so there's no promise it works. The things to check are that the site can write to `umbraco/Data/xStatic/output`, that it can reach its own page URLs over HTTP, and that your deployer can reach its host from there. Try it on a non-live environment first.

## Using it

### How long does a build take?

It depends on how many pages, media files and crops you have, how fast your site renders each page, and how many languages you build. Pages are generated one after another, and the card remembers the last duration to size its progress bar. Try it on your own site: there's no honest number to give in advance. Deploy times depend on the host (Netlify only uploads files that changed, FTP and folder deploys copy everything).

### Does it rebuild only what changed?

No. Every generate is a full rebuild of the site, and the FTP and folder deployers copy every file each time. Netlify skips files it already has ([What happens during a deploy](Deploying-to-Netlify.md#what-happens-during-a-deploy)).

### Can I run more than one site?

Yes. Each site has its own root node, export type, deployment target and output folder, so you can build several from one Umbraco installation, or have an HTML and a JSON site side by side ([Sites](Sites.md)).

### Does it support multi-language sites?

Yes. Tick the languages under **Cultures** on the site and each page is generated once per language, into the folders Umbraco's URLs describe. You'll usually want an action that copies the default language's home page to the root ([Multi-language sites](Multi-Language-Sites.md)).

### Can I build the site on a schedule, or rebuild when an editor publishes?

Both. **Auto Publish** rebuilds and deploys when content under the site's root is published ([Auto publish](Auto-Publish.md)). For schedules or builds triggered by another system, the `xStatic.RemoteOperations` package calls xStatic's API from a scheduled job such as an Azure Function ([Remote operations](Remote-Operations.md)).

### Can I produce JSON for a headless front end?

Yes. Create a JSON export type and xStatic writes one JSON file per published page. It's deliberately basic: no search, no filtering and no index file ([JSON export](JSON-Export.md)).

### Can I change the HTML xStatic produces?

Yes. Every page passes through a list of transformers, and you can add your own to change HTML or JSON before it's saved. See [Writing a transformer](Writing-a-Transformer.md) and [Export types](Export-Types.md).

### What can editors do, and what is only for admins?

Editors in the `xStaticNormalUser` group can create and edit sites, and generate, deploy, clean and download them. They can't see deployment targets or actions, which hold passwords and tokens. Those are for `xStaticAdmin`. The groups are created for you, with the root user added, and you add other people by hand ([User groups and security](User-Groups-and-Security.md)).

### Do my editors need to change how they work?

No. They keep publishing in the Umbraco backoffice as usual, and someone presses **Generate** and **Deploy**, or Auto Publish does it ([Generating and deploying](Generating-and-Deploying.md)). The Umbraco backoffice doesn't need to be on the public internet, because visitors only see the generated files.

## Going further

### Can I use it as a backup or failover copy of my site?

Yes, that's a good use. A static copy kept on another host can take over when Umbraco is down. xStatic produces and refreshes the copy, and your own reverse proxy decides which version visitors get. Forms and other dynamic features won't work in the copy. See [Static failover site](Static-Failover-Site.md).

### How do I upgrade from an older version?

Update every xStatic package together to the same version and start the site. xStatic runs its database migrations itself, and from 17.3.0 / 18.0.0 it also copies sites across from xStatic 13 ([Upgrading](Upgrading.md)).

### How do I extend it or contribute?

Generators, transformers, deployers and actions are all plugin points, with a guide for each starting at [Extending xStatic](Extending-xStatic.md). To contribute code or docs, read [Developing xStatic](Developing-xStatic.md), then open an issue or pull request on [GitHub](https://github.com/Mulliman/xStatic-for-Umbraco). The wiki pages live in the repository's `Wiki/` folder, so fixes to them are pull requests too.

### Where can I see it in action?

[Videos and talks](Videos-and-Talks.md) lists them all. The [xStatic 14 - Get Started](https://www.youtube.com/watch?v=_BW8oV3LI1Q) video walks through the backoffice (the registration code it shows is no longer needed), and [Your first static site](Your-First-Static-Site.md) is the written equivalent.

## Next steps

- [What is xStatic?](What-is-xStatic.md)
- [Installation](Installation.md)
- [Troubleshooting](Troubleshooting.md)
- [Glossary](Glossary.md)
