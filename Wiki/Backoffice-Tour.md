A guided look at everything in the **xStatic** section of the Umbraco backoffice: each tab, who can see it, and what
every card and button does. Use it as a map, then follow the links for the detail.

## At a glance

xStatic adds one section to the backoffice, called **xStatic** (address `/umbraco/section/xstatic`). Each tab in the
section header is a dashboard.

| Tab | Who sees it | What you do there |
|-----|-------------|-------------------|
| [xStatic Sites](#xstatic-sites) | Normal users and admins | Create sites, then generate, deploy, clean and download them |
| [Export Types](#export-types) | Normal users and admins | Choose how pages become files |
| [Deployment Targets](#deployment-targets) | Admins only | Set up where sites are deployed to |
| [Actions](#actions) | Admins only | Set up steps that run after generation |
| [Config](#config) | Normal users and admins | See which components are installed |
| [Documentation](#documentation) | Normal users and admins | Read the built-in xStatic docs and browse plugins |

The tabs appear in that order, with **xStatic Sites** first.

### Who is a normal user and who is an admin

Access comes from two user groups that xStatic creates, `xStaticNormalUser` and `xStaticAdmin`. Admins can see
everything. Normal users see everything except **Deployment Targets** and **Actions**, because those can hold
passwords and tokens. The group `xStaticAdmin` also counts as a normal user.

The tabs are hidden for users who are in neither group when xStatic's user groups are switched on, which is the
default. If you register xStatic yourself without `UseSecureUserGroups()`, every user who has the xStatic section sees
every tab. [User groups and security](User-Groups-and-Security.md) has the full rules.

### Things every dashboard shares

- A **Create new ...** card on the left with an explanation, a **+** button (labelled **Create**) in its header and a
  larger button below. Both open the same dialog.
- One card per item to the right of it, with **Edit** (brush icon) and **Delete** (bin icon) buttons in the header.
- Dialogs have **Cancel** and **Submit** buttons (the automatic deployment target dialog has **Create** instead of
  **Submit**). **Submit** checks the required fields (marked with `*`) and shows a
  red message above any that are empty. The dialog stays open until the fields are valid.
- Deleting always asks for confirmation first.
- Saving an export type, action or deployment target refreshes the site dialog's dropdowns straight away, so you
  don't need to reload the page.

## xStatic Sites

The first tab, and the one editors use day to day. Each site is a card. See [Sites](Sites.md) for every field in the
dialog.

**Create new site** card

- Explains that you need an export type first (and a deployment target if you want to deploy).
- The **Create new static site** button opens the **Create new site** dialog.

**Site card**

The headline is the site name. The details table lists, in order, only the lines that apply:

| Line | Meaning |
|------|---------|
| The root path, for example `Home/Blog` | The content node the site is built from. **Item Not Found** means that node is unpublished or deleted |
| **Cultures: en-US \| da** | The language variants chosen, if any |
| **Exports as ...** | The export type's name |
| **Auto Publish On** or **Manual Deploy** | Whether publishing content triggers a build and deploy |
| **Last generated on ...** or **This site has never been built.** | When the site was last generated |
| **Last deployed on ...** or **This site has never been deployed.** | When it was last deployed |
| A link to `https://{Target Hostname}` | Only if **Target Hostname** is set |
| **Size: ...** | How big the stored output is. Hidden when empty |

Buttons, with the condition that shows each one:

| Button | Shown when | What it does |
|--------|-----------|--------------|
| **Generate** | The site has an export type | Fetches every published page, copies media and assets, runs actions and stores the result |
| **Deploy** | The site has a deployment target | After you confirm, sends the stored output to the deployment target |
| **Clean** | The site has been generated and the output isn't empty | After you confirm, deletes the stored output, keeping `.git` and `CNAME` by default |
| **Download** | Same as **Clean** | Downloads the stored output as a zip file |
| **Edit** (header) | Always | Opens the site dialog, headed **Edit {name} site** |
| **Delete** (header) | Always | After you confirm, deletes the site's settings. The stored output is not deleted |

While a task runs, the card is replaced by a progress bar headed **Generating...**, **Deploying...** or
**Downloading...**. The bar is sized from how long the last generate or deploy took, and for **Download** from a fixed
ten seconds. With no previous time to go on, such as on the first run, it jumps to 100% after a second and stays there
until the task finishes. After generating, an error notification headed **Generation failed** appears if the run failed outright, and a
warning notification headed **Site generated with N problem(s)** lists the first five problem items if only some failed.

See [Generating and deploying](Generating-and-Deploying.md) for what each step does.

## Export Types

An export type picks the components that turn a Umbraco page into a file: a generator, a transformer list factory and
a file name generator. xStatic adds one called **HTML Website**. See [Export types](Export-Types.md) for the dialog and
for making a JSON type.

- **Create new Export Type** card with a **Create new Export Type** button.
- One card per type. The table shows its name and the names of the three components.
- Normal users can create, edit and delete export types as well as admins. That is intentional.

## Deployment Targets

Admins only. A deployment target is one configured destination, such as "my Netlify site" or "the FTP server". See
[Deployment targets](Deployment-Targets.md).

- **Create new Deployment Target** card with two buttons:
  - **Manually Configure New Deployment Target** opens a dialog where you pick a deployer and fill in its fields.
  - **Automatically Create New Deployment Target** (in a yellow box) lets xStatic create the remote service for you
    and configure the target. The only creator that ships is the Netlify Site Creator, in the `xStatic.Netlify` package.
- One card per target. The table shows its name and its deployer's id, such as `filesystem` or `netlify`.

## Actions

Admins only. A post-generation action runs on the generated files once all pages have been created, for example
copying `404/index.html` to `404.html`. See [Post-generation actions](Post-Generation-Actions.md).

- **Create new Action** card with a **Create new Action** button.
- The dialog has **Action Name \***, **Action Type \*** and a **Configuration** panel whose fields depend on the type.
  Picking a type with no fields shows "This action type can't be configured".
- One card per action. The table shows its name and its type, such as `FileCopyAction`.
- Sites choose actions in the site dialog under **Post Generation Actions**. Normal users can tick actions there by
  name even though they can't see this tab.

## Config

Read-only, for everyone with access. It shows the components xStatic found when it started, in five boxes. Each box
says what the component does and lists what is installed under **Installed Components:**.

| Box | Shows |
|-----|-------|
| **Generators** | Classes that create the HTML or JSON for each page |
| **Transformer List Factories** | Classes that decide which transformers run and in what order |
| **Deployers** | Classes that push the site to a remote service |
| **File Name Generators** | Classes that name each generated file |
| **Post Generation Actions** | Action types you can configure on the **Actions** tab |

Use it to check that a plugin you installed was found. These lists feed the dropdowns in the export type, deployment
target and action dialogs. See [Architecture](Architecture.md) for how components are discovered.

## Documentation

The **Documentation** tab has two sub-views, both built directly into `xStatic.Client` so they work offline without leaving the backoffice:

- **Documentation**: the full xStatic wiki for your installed version. Use the sidebar to browse topics, search across page titles, headings and body text, copy code snippets, or open any page on GitHub.
- **Plugins**: official xStatic add-on packages available for your version (deployers, AI integration, remote operations and the MCP server), with direct links to their built-in documentation, NuGet and GitHub source.

## Languages and wording

The xStatic backoffice is in English only. Its labels are not part of Umbraco's translation files.

## Videos

The [xStatic 14 - Get Started video](https://www.youtube.com/watch?v=_BW8oV3LI1Q) walks through these tabs on screen.
It was recorded for xStatic 14, so details differ slightly from xStatic 18.

## Next steps

- [Sites](Sites.md): every field in the site dialog.
- [Export types](Export-Types.md) and [Deployment targets](Deployment-Targets.md): the other two things a site needs.
- [Generating and deploying](Generating-and-Deploying.md): what the buttons do in detail.
- [User groups and security](User-Groups-and-Security.md): who sees what.
