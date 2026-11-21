The terms xStatic uses in the backoffice, the documentation and the code, in alphabetical order. Each has a short
definition and a link to the page that explains it properly.

## A

**Action**: see [post-generation action](Post-Generation-Actions.md).

**Asset paths**: the extra files and folders that aren't Umbraco content or media but must be in the static site, such
as `css`, `js` or `fonts`. A site lists them and xStatic copies them into the output, and reports any that are missing.
See [Asset paths](Asset-Paths.md).

**Auto publish**: a site setting that regenerates and deploys the site when an editor publishes content under its root
node. It needs a deployment target. See [Auto publish](Auto-Publish.md).

## C

**Config**: the xStatic tab in the backoffice that lists the installed xStatic components, such as deployers, generators and
actions. See [Backoffice tour](Backoffice-Tour.md).

**Crop**: see [image crops](Image-Crops.md).

**Culture**: a language and region variant of your content, such as `en-GB`. A multi-language site picks which
cultures to generate, and the output usually has a folder per culture, depending on your hostnames. See [Multi-language sites](Multi-Language-Sites.md).

## D

**Deployer**: the code that publishes a generated site to a destination, such as Netlify, a Git repository, an FTP
server or a folder. It implements `IDeployer`. See [Writing a deployer](Writing-a-Deployer.md).

**Deployer definition**: the description of a deployer: its id, its name and the fields (host, token and so on) the
backoffice shows when you create a deployment target. It implements `IDeployerDefinition`. See
[Writing a deployer](Writing-a-Deployer.md).

**Deployment target**: a saved destination: a deployer plus the values for its fields. Sites point at a deployment
target, and several sites can share one. See [Deployment targets](Deployment-Targets.md).

**Deployment target creator**: a helper that sets up a destination for you, such as creating a Netlify site and the
deployment target for it. It implements `IDeploymentTargetCreator`. See
[Deployment target creators](Deployment-Target-Creators.md) and [Deploying to Netlify](Deploying-to-Netlify.md).

**Download**: a way to get the generated site as a zip file from the backoffice, instead of deploying it. See
[Generating and deploying](Generating-and-Deploying.md).

## E

**Export type**: the recipe for how a site's pages become files: a generator, a transformer list and a file name
generator. The built-in one is **HTML Website**; a JSON type is for headless output. See
[Export types](Export-Types.md) and [JSON export](JSON-Export.md).

## F

**File name generator**: decides the path and file name each page is saved under, for example turning `/about/` into
`about/index.html`. It implements `IFileNameGenerator`. See [File name generators](File-Name-Generators.md).

## G

**Generate**: the first stage of a run: xStatic fetches every published page, transforms it and stores it in the
output folder. See [Generating and deploying](Generating-and-Deploying.md).

**Generator**: the code that produces the content of one page, for example fetching the rendered HTML from the running
site or building JSON. It implements `IGenerator`. See [Writing a generator](Writing-a-Generator.md).

## H

**Hostname (target hostname)**: a site setting naming the public address of the static site. A transformer rewrites
links and meta tags (such as `og:url`) from the Umbraco site's address to this one. See [Sites](Sites.md).

## I

**Image crops**: the sizes a site asks for from Umbraco's image processing, for example `800x600`. xStatic
saves each as a file and rewrites image URLs to match. See [Image crops](Image-Crops.md).

**Image crop name generator**: decides the file name for a cropped image. It implements `IImageCropNameGenerator`. See
[File name generators](File-Name-Generators.md).

## J

**Job**: the plan for one run: the pages, media, crops, asset folders and files to produce, and the transformers to apply. `JobBuilder` builds it and `JobRunner` carries it out, one item at a time. See
[Architecture](Architecture.md).

## M

**Management API**: the backoffice HTTP API the xStatic user interface uses, with the OpenAPI document at
`/umbraco/openapi/xstatic-v1.json`. See [Management API](Management-API.md).

## O

**Output folder (staging folder)**: where generated files are stored before they are deployed. By default it is
`umbraco/Data/xStatic/output/<site id>` under the site's content root. See
[Generating and deploying](Generating-and-Deploying.md) and [Site storers](Site-Storers.md).

## P

**Post-generation action**: a step that runs after the site is generated, such as copying, renaming or deleting a file, or
copying a page to a Netlify `404.html`. It implements `IPostGenerationAction` and is set up in the **Actions** section. See
[Post-generation actions](Post-Generation-Actions.md) and
[Writing a post-generation action](Writing-a-Post-Generation-Action.md).

## R

**Remote operations**: triggering generate and deploy from outside Umbraco, using an Umbraco API user and the
`xStatic.RemoteOperations` client package. See [Remote operations](Remote-Operations.md).

**Root node**: the content node a site starts from. The site is that node and everything below it. See
[Sites](Sites.md).

## S

**Site**: a site definition in xStatic: a root node, an export type, a deployment target and the rest of the settings.
You can have several in one Umbraco installation. See [Sites](Sites.md).

**Site storer**: stores the generated files, and decides where the output folder is. It implements
`IStaticSiteStorer`. See [Site storers](Site-Storers.md).

**Static site**: a site made only of files (HTML, CSS, JavaScript, images, and sometimes JSON) with nothing running on
the server. See [What is xStatic?](What-is-xStatic.md).

## T

**Transformer**: a step that changes a page's content after it is generated, for example rewriting URLs or swapping the
hostname. It implements `ITransformer`. See [Writing a transformer](Writing-a-Transformer.md).

**Transformer list**: the ordered set of transformers an export type applies. A **transformer list factory**
(`ITransformerListFactory`) builds it for each site. See [Writing a transformer](Writing-a-Transformer.md) and
[Export types](Export-Types.md).

## U

**User groups (xStaticAdmin, xStaticNormalUser)**: the two Umbraco user groups xStatic creates. **xStaticNormalUser**
can manage sites and generate, deploy and download. **xStaticAdmin** can also manage deployment targets and
actions. See [User groups and security](User-Groups-and-Security.md).

## X

**XStaticComposer**: the Umbraco composer that registers xStatic for you when your site starts. Since 14.1.0 you don't
need any code to install xStatic. See [Installation](Installation.md) and [Extending xStatic](Extending-xStatic.md).

## See also

- [Architecture](Architecture.md) for how the terms fit together
- [Backoffice tour](Backoffice-Tour.md) for where each appears on screen
- [FAQ](FAQ.md) for short answers
