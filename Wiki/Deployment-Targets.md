A deployment target is one configured destination for your generated site, such as "our Netlify site" or "the FTP
server". This page explains what a target is, how to create and edit one by hand or with a creator (the Netlify Site Creator or the Cloudflare Pages Project Creator),
and how xStatic handles the passwords and tokens inside them. Deployment targets are for admins only.

## At a glance

- A **deployer** is a piece of code that knows how to push files to one kind of place (a folder, Netlify, Cloudflare, Git, FTP).
  A **deployment target** is one set of settings for a deployer: which folder, which Netlify site, which login.
- You can have many targets for the same deployer, for example a staging and a live Netlify site.
- A [site](Sites.md) points at one target. Several sites can share a target.
- Only users in the `xStaticAdmin` group see the **Deployment Targets** tab or can call its endpoints. Normal users can
  still pick a target by name in the site dialog.
- Targets live in the `XStaticDeploymentTargets` database table.

## The deployers that come with xStatic

| Deployer (as listed in **Deployer**) | Package | Fields | Page |
|--------------------------------------|---------|--------|------|
| **File System** | Built in | **Folder Path** | [Deploying to a folder](Deploying-to-a-Folder.md) |
| **Netlify** | `xStatic.Netlify` | **Personal Access Token**, **Site ID** | [Deploying to Netlify](Deploying-to-Netlify.md) |
| **Netlify (Legacy)** | `xStatic.Netlify` | **Personal Access Token**, **Site ID** | [Deploying to Netlify](Deploying-to-Netlify.md) |
| **Git** | `xStatic.Git` | **Remote URL**, **Email**, **Username**, **Password / Personal Access Token**, **Branch** | [Deploying with Git](Deploying-with-Git.md) |
| **FTP** | `xStatic.Ftp` | **Hostname**, **Username**, **Password**, **Folder**, **Port** | [Deploying to FTP](Deploying-to-FTP.md) |
| **Cloudflare Pages** | `xStatic.Cloudflare` | **Account ID**, **API Token**, **Project Name**, **Branch (optional)**, **Generate AI/Markdown _headers** | [Deploying to Cloudflare](Deploying-to-Cloudflare.md) |
| **Cloudflare R2** | `xStatic.Cloudflare` | **Account ID**, **Bucket Name**, **Access Key ID**, **Secret Access Key**, **Key Prefix (optional)**, **Endpoint URL Override (optional)** | [Deploying to Cloudflare](Deploying-to-Cloudflare.md) |

Every deployer except **File System** is in its own NuGet package. Install the package and restart the site to add it.

Anyone can add more. See [Writing a deployer](Writing-a-Deployer.md). A new deployer appears in the dropdown after you
install it and restart the site. The **Config** tab lists the ones xStatic found.

## Create a deployment target

1. Open **xStatic > Deployment Targets**.
2. Click **Manually Configure New Deployment Target**. (The **+** in the card's header does the same.)
3. Fill in the dialog, headed **Create new Deployment Target**:

   | Field | Required | What it does |
   |-------|----------|--------------|
   | **Name \*** | Yes | A name for the card and the site dialog's dropdown. Keep it under 200 characters, which is the size of the database column |
   | **Deployer \*** | Yes | The kind of destination. Description: "This is the type of deployer that you want to configure a specific instance of." |
   | **Configuration** | Depends on the deployer | The deployer's own fields. They change when you pick a different deployer |

4. Click **Submit**.

If you leave a required field empty, a message appears above it: **Name is required** or
**Deployer Definition is required**.

The new target appears as a card and in the **Deployment Target** dropdown of the site dialog straight away.

### The Configuration panel

Picking a **Deployer** fills the **Configuration** panel with that deployer's fields. Each field has a label and an
editor. Until you pick a deployer the panel says "No Type selected". Fields that
hold a secret, such as a token or password, use a masked input with a **Show** or **Hide** button beside it, so
the value doesn't appear on screen while you work.

Instead of typing a secret, you can type a reference such as `${env:XSTATIC_NETLIFY_TOKEN}`, and xStatic reads the
environment variable each time it deploys. This is the recommended way. The line under each secret field and the box
headed **Keep passwords and tokens out of the database.** explain it, and
[Secrets and environment variables](Secrets-and-Environment-Variables.md) covers it in full.

## Create a Netlify site automatically

For Netlify you can let xStatic make the Netlify site for you and fill in the target at the same time. This is the
fast route shown in the [xStatic 14.1 Speedrun video](https://www.youtube.com/watch?v=tYdYG3PgRcQ).

1. Create a personal access token in your Netlify account. [Deploying to Netlify](Deploying-to-Netlify.md) shows how.
2. Open **xStatic > Deployment Targets** and click **Automatically Create New Deployment Target**. It is in the
   yellow box that says "You can also let xStatic create the remote service, and configure the Deployment Target with
   the required details."
3. In the dialog, headed **Automatically Create New Deployment Target**, choose **Creator Template \***. For Netlify,
   pick **Netlify Site Creator** (from `xStatic.Netlify`). The panel below it shows its fields:
   - **Personal Access Token**: your Netlify token. Help text above the fields explains where to get one.
   - **Site Name**: the subdomain you want. The field shows `.netlify.app` after it, and the arrow beside it opens
     `https://{name}.netlify.app` so you can check whether the name is already taken.
4. Click **Create**.

xStatic asks Netlify to create the site and then saves a new **Netlify** deployment target, named after the **Site
Name**, with the token and the new site's ID filled in.

Things to know:

- The dialog also has a **Name \*** field. It can't be empty ("Name is required" appears above it), but the Netlify
  creator names the target after the **Site Name**, so what you type in **Name** isn't used. The creator's own help
  text suggests testing the site name first.
- If the name is taken, or Netlify refuses, xStatic answers with "Error creating site on Netlify, please make sure that
  the site name is unique and try again." (HTTP 409). The backoffice may only show a generic error, because it doesn't
  read that message, so if nothing is created, check the name first. A blank token or site name fails with a server
  error instead.
- The token is saved in the new target exactly as you typed it. Type a reference such as
  `${env:XSTATIC_NETLIFY_TOKEN}` and the new target keeps the reference rather than the token
  ([Secrets and environment variables](Secrets-and-Environment-Variables.md)).

### Create a Cloudflare Pages project automatically

With `xStatic.Cloudflare` installed, **Creator Template \*** also offers **Cloudflare Pages Project Creator**. Fill in
**Account ID \***, **API Token \*** (a token with **Cloudflare Pages: Edit** permission), **Project Name \*** and, if you
don't want `main`, **Production Branch**, then click **Create**. xStatic creates a Direct Upload project and saves a
**Cloudflare Pages** target named after the project. As with Netlify, a `${env:...}` or `${config:...}` reference typed
into the token field is restored in the saved target, so the token itself isn't stored. See
[Deploying to Cloudflare](Deploying-to-Cloudflare.md#step-2-create-a-deployment-target-or-provision-a-new-project).

Creators are a plugin point too. See [Deployment target creators](Deployment-Target-Creators.md).

## Edit a deployment target

1. Click **Edit** (the brush icon) on the target's card. The dialog is headed **Edit {name} target**.
2. Change the **Name** or the **Configuration** values and click **Submit**.

The **Deployer** can be changed too. If you switch to a deployer with different fields, the panel shows the new
deployer's empty fields and the old values are dropped. The change takes effect on the next deploy for every site that
uses the target.

## Delete a deployment target

1. Click **Delete** (the bin) on the card.
2. Confirm in the **Delete Deployment Target** dialog.

xStatic doesn't check whether sites use the target. Those sites keep a link to a target that no longer exists, so
deploying them fails with a "Deployment target not found" error until you choose another target. Edit each site to pick a new one.

If a target's deployer is no longer installed, for example you removed `xStatic.Ftp`, the target is left out of the
**Deployment Targets** list, though its data stays in the database. Install the package again and it comes back. Until then the target still appears in a site's **Deployment Target**
dropdown, and deploying to it fails.

## What the card shows

The headline is the target's name. The table has the name and the **type**, which is the deployer's id
(`filesystem`, `netlify`, `netlify-legacy`, `git`, `ftp`, `cloudflare-pages`, `cloudflare-r2`), not its display name.

## Secrets: where they live and who sees them

Deployer settings often include credentials. This is how xStatic treats them.

| Question | Answer |
|----------|--------|
| Where are they stored? | In the `Config` column of `XStaticDeploymentTargets`, as JSON, in plain text, exactly as typed. If you typed a reference such as `${env:XSTATIC_NETLIFY_TOKEN}`, only the reference is stored and the secret stays in the environment variable |
| Are they sent to the browser? | **Yes, whatever was typed.** To an admin, the list of targets includes every field's current value, passwords and tokens included, so the edit dialog can show them. The masked input hides them on screen, not in the response. A reference is sent as the reference, never as the value it stands for. The responses tell the browser not to cache them |
| Who can get them? | Only users in `xStaticAdmin`. The endpoints that return them require that group |
| Do normal users see them? | No. The site dialog gets only each target's id, name and deployer id |

So treat `xStaticAdmin` as a privileged role: put only trusted people in it. Prefer tokens with the smallest permission
that works (a Git token limited to one repo's contents, a Netlify token you can revoke), and rotate them if someone
leaves. Better still, keep the secrets out of xStatic altogether with
[secret references](Secrets-and-Environment-Variables.md).

> If you register xStatic yourself and don't call `UseSecureUserGroups()`, the admin restriction isn't applied: any
> signed-in backoffice user can call the deployment target endpoints and read these values. See
> [User groups and security](User-Groups-and-Security.md#without-secure-user-groups).

Upgrading from xStatic 13 also leaves the old `XStaticSiteConfigs` table, which holds credentials in plain text. Drop it
once you have checked your sites. See [Upgrading](Upgrading.md).

## Next steps

- [Deploying to a folder](Deploying-to-a-Folder.md), [Netlify](Deploying-to-Netlify.md),
  [Cloudflare](Deploying-to-Cloudflare.md), [Git](Deploying-with-Git.md) and [FTP](Deploying-to-FTP.md): the details
  for each deployer.
- [Sites](Sites.md): choose a target for a site.
- [Generating and deploying](Generating-and-Deploying.md): what happens when you click **Deploy**.
