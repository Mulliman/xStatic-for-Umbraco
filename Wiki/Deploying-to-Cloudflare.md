Deploy your static Umbraco site to **Cloudflare Workers** (as static assets), **Cloudflare Pages** (via the Direct Upload API) or **Cloudflare R2** (via Cloudflare's S3-compatible API). None of them need a Git repository. This guide covers installing `xStatic.Cloudflare`, choosing a deployer, configuring targets in the backoffice, creating a Worker automatically, and generating `_headers` and `_redirects` files.

## Which deployer to use

| Deployer | Use it when |
|----------|-------------|
| **Cloudflare Workers** | You're starting a new Cloudflare site. Cloudflare now puts its new hosting features into Workers static assets, and offers a guide to [migrate from Pages to Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/). |
| **Cloudflare Pages** | You already have a Pages Direct Upload project and want to keep it. Pages still works and is still supported. |
| **Cloudflare R2** | You want the files in an object storage bucket, for example behind your own CDN rules. |

## Install the package

From your Umbraco project folder, run:

```powershell
dotnet add package xStatic.Cloudflare
```

When you use xStatic's default automatic setup, restarting the site automatically discovers:

- **Cloudflare Workers** deployer (`cloudflare-workers`)
- **Cloudflare Workers Creator** (`cloudflare-workers-creator`)
- **Cloudflare Pages** deployer (`cloudflare-pages`)
- **Cloudflare Pages Project Creator** (`cloudflare-pages-project-creator`)
- **Cloudflare R2** deployer (`cloudflare-r2`)
- **CloudflareHeadersAction** and **CloudflareRedirectsAction** post-generation actions

You don't need to edit `Program.cs` unless you register xStatic manually. If you do configure xStatic yourself, add the deployers and optional actions to your builder:

```csharp
using XStatic.Cloudflare;
using XStatic.Core.App;

var xStatic = builder.Services.AddXStatic();
xStatic.DeployServiceBuilder.AddCloudflareDeployers();
// ...register the rest, then call xStatic.Build();

builder.Services.AddCloudflareActions(); // optional
```

Don't combine `Automatic()` with `AddCloudflareDeployers()`: the same deployers would be registered twice and start-up fails. `AddCloudflareActions()` is optional, because xStatic creates actions through dependency injection and resolves their constructor dependencies itself.

## Deploy to Cloudflare Workers

`CloudflareWorkersDeployer` ([source](../Source/XStaticCore/XStatic.Cloudflare/CloudflareWorkersDeployer.cs)) publishes the generated site as an *assets-only* Worker: a Worker with static files and no code of its own. It uses Cloudflare's [static assets Direct Upload](https://developers.cloudflare.com/workers/static-assets/direct-upload/) flow:

1. It sends Cloudflare a manifest of every file, with a hash and size for each.
2. Cloudflare answers with the files it doesn't already have, and xStatic uploads only those, with accurate MIME types (including `text/markdown; charset=utf-8` for `.md` files).
3. It uploads the Worker, which makes the new set of files live. Any `_headers` and `_redirects` files in the generated site are sent with it as the Worker's header and redirect rules.
4. If **Enable workers.dev URL** is on, it turns on the Worker's `workers.dev` URL and reports it in the deploy message, such as `https://my-site.your-subdomain.workers.dev`.

### Step 1: Create a Cloudflare API token

1. Sign in to the Cloudflare dashboard and open **My Profile > API Tokens** (`https://dash.cloudflare.com/profile/api-tokens`).
2. Select **Create Token**. The **Edit Cloudflare Workers** template works, or create a custom token with **Account > Workers Scripts: Edit**.
3. Copy the token and note your **Account ID** from the Cloudflare dashboard URL or the **Workers & Pages** overview.

If your account has never used Workers, open **Workers & Pages** in the dashboard once so Cloudflare sets up your `workers.dev` subdomain.

### Step 2: Create the Worker and its deployment target

The quickest way is to let xStatic create the Worker:

1. Open **xStatic > Deployment Targets** and select **Automatically Create New Deployment Target**.
2. Pick **Cloudflare Workers Creator**, and fill in **Account ID \***, **API Token \*** and **Worker Name \*** (1 to 63 lowercase letters, digits or hyphens).
3. Select **Create**. xStatic checks the name isn't already in use, deploys a one-page "being set up" placeholder to a new Worker, turns on its `workers.dev` URL, and saves a **Cloudflare Workers** target named after the Worker.

The creator refuses a Worker name that already exists, so it can't overwrite a live site. To deploy to an existing Worker, configure the target by hand instead:

1. Open **xStatic > Deployment Targets** and select **Manually Configure New Deployment Target**.
2. Enter a **Name**, choose **Cloudflare Workers** as the **Deployer**, and fill in the fields:

| Field | Required | Notes |
|-------|----------|-------|
| **Account ID** | Yes | Your Cloudflare Account ID. |
| **API Token** | Yes | Token with **Workers Scripts: Edit** permission. |
| **Worker Name** | Yes | The Worker to deploy to. It's created on the first deploy if it doesn't exist. A deploy replaces everything that Worker serves, including any code it had. |
| **HTML Handling (optional)** | No | How URLs map to `.html` files: `auto-trailing-slash` (Cloudflare's default when blank), `force-trailing-slash`, `drop-trailing-slash` or `none`. See Cloudflare's [static assets routing](https://developers.cloudflare.com/workers/static-assets/routing/). |
| **Not Found Handling (optional)** | No | What a URL that matches no file returns: `404-page` (the nearest `404.html` with a 404 status; filled in for you), `single-page-application` (`index.html` with a 200 status) or `none` (Cloudflare's default when blank, an empty 404). |
| **Compatibility Date (optional)** | No | A Workers compatibility date such as `2025-09-01`. Leave it blank to let Cloudflare choose. |
| **Enable workers.dev URL** | No | On by default. Switch it off if you serve the site only on a custom domain; xStatic then leaves the Worker's `workers.dev` setting alone. |
| **Generate AI/Markdown `_headers`** | No | When enabled and the generated site has no `_headers` file, sends `Vary: Accept` and `Content-Type: text/markdown; charset=utf-8` for `/*.md` rules to support Cloudflare's *Markdown for Agents*. |

3. Select **Submit**, assign the target to your site, generate, and select **Deploy**.

To put the site on your own domain, add a custom domain to the Worker in the Cloudflare dashboard (**Workers & Pages > your Worker > Settings > Domains & Routes**). xStatic doesn't change domains or routes.

### Move a site from Pages to Workers

1. Create a **Cloudflare Workers** target as above, with a new token that has **Workers Scripts: Edit**.
2. Assign it to the site in place of the Pages target, then generate and deploy.
3. Check the site on its `workers.dev` URL. Your `_headers` and `_redirects` files carry over unchanged.
4. Move your custom domain from the Pages project to the Worker in the Cloudflare dashboard, then delete the Pages project when you're happy.

If you used Pages' default "nearest `404.html`" behaviour, keep **Not Found Handling** at `404-page`.

## Deploy to Cloudflare Pages

`CloudflarePagesDeployer` ([source](../Source/XStaticCore/XStatic.Cloudflare/CloudflarePagesDeployer.cs)) uses Cloudflare's Pages Direct Upload flow: it requests a short-lived upload JWT, hashes every generated file, uploads only missing or changed files in batches with accurate MIME types (including `text/markdown; charset=utf-8` for `.md` files), registers asset hashes, and creates a deployment with any `_headers` or `_redirects` files. For a new site, use [Cloudflare Workers](#deploy-to-cloudflare-workers) instead.

### Step 1: Create a Pages API token

1. Sign in to the Cloudflare dashboard and open **My Profile > API Tokens** (`https://dash.cloudflare.com/profile/api-tokens`).
2. Select **Create Token** and grant **Account > Cloudflare Pages: Edit**.
3. Copy the token and note your **Account ID** from the Cloudflare dashboard URL or the **Workers & Pages** overview.

### Step 2: Create a Pages deployment target (or provision a new project)

If you already have a Cloudflare Pages Direct Upload project:

1. Open **xStatic > Deployment Targets** and select **Manually Configure New Deployment Target**.
2. Enter a **Name**, choose **Cloudflare Pages** as the **Deployer**, and fill in the fields:

| Field | Required | Notes |
|-------|----------|-------|
| **Account ID** | Yes | Your Cloudflare Account ID. |
| **API Token** | Yes | Token with **Cloudflare Pages: Edit** permission. |
| **Project Name** | Yes | Existing Cloudflare Pages project name. |
| **Branch (optional)** | No | Leave blank for the production branch, or enter a preview branch name. |
| **Generate AI/Markdown `_headers`** | No | When enabled and no `_headers` file exists in the output, writes a `_headers` file with `Vary: Accept` and `Content-Type: text/markdown; charset=utf-8` for `/*.md` to support Cloudflare's *Markdown for Agents*. |

3. Select **Submit**, assign the target to your site, generate, and select **Deploy**.

To create a brand-new Cloudflare Pages project from the backoffice instead, select **Automatically Create New Deployment Target** in **xStatic > Deployment Targets**, pick **Cloudflare Pages Project Creator**, and supply your Account ID, API Token, Project Name, and optional Production Branch. xStatic calls Cloudflare's API to create the project and saves a matching deployment target for you.

## Deploy to Cloudflare R2

`CloudflareR2Deployer` ([source](../Source/XStaticCore/XStatic.Cloudflare/CloudflareR2Deployer.cs)) uploads generated files directly to an R2 bucket using AWS Signature Version 4 (`AwsSigV4Signer`) against `https://{accountId}.r2.cloudflarestorage.com`.

1. In the Cloudflare dashboard, open **R2 Object Storage > Manage R2 API Tokens** and create a token with **Object Read & Write** permission for your bucket. Note the **Access Key ID** and **Secret Access Key**.
2. In Umbraco, open **xStatic > Deployment Targets** and select **Manually Configure New Deployment Target**.
3. Choose **Cloudflare R2** as the **Deployer** and enter:

| Field | Required | Notes |
|-------|----------|-------|
| **Account ID** | Yes (unless Endpoint URL Override is set) | Your Cloudflare Account ID. |
| **Bucket Name** | Yes | Target R2 bucket name. |
| **Access Key ID** | Yes | R2 API token Access Key ID. |
| **Secret Access Key** | Yes | R2 API token Secret Access Key. |
| **Key Prefix** | No | Optional folder prefix inside the bucket, such as `site/`. |
| **Endpoint URL Override** | No | Optional custom S3 endpoint, such as an EU jurisdiction endpoint (`https://YOUR-ACCOUNT-ID.eu.r2.cloudflarestorage.com`). |

4. Select **Submit**, attach the target to your site, generate, and deploy.

## Post-generation actions (`_headers` and `_redirects`)

`xStatic.Cloudflare` includes two post-generation actions you can configure in **xStatic > Actions**. Workers and Pages read the files they write in the same format:

- **`CloudflareHeadersAction`**: writes `/_headers` into the generated site root. You can enable the built-in *Markdown for Agents* rules (**IncludeMarkdownForAgents**) and append custom [header rules](https://developers.cloudflare.com/workers/static-assets/headers/) (**CustomRules**).
- **`CloudflareRedirectsAction`**: writes `/_redirects` into the generated site root from your configured [redirect rules](https://developers.cloudflare.com/workers/static-assets/redirects/) (**Rules**).

These actions run locally during generation, so you can inspect the generated `_headers` and `_redirects` files in `umbraco/Data/xStatic/output/{siteId}/` even before connecting a live Cloudflare account. The Workers and Pages deployers send them to Cloudflare as rules rather than as public files.

## Limitations

- The Workers deployer always deploys straight to production. It doesn't upload preview versions or gradual rollouts; use the Pages deployer's **Branch** field if you need preview deployments.
- The Workers deployer publishes only static assets. It doesn't upload Worker code, and it skips Pages-only `_worker.js` and `_routes.json` files so they aren't served publicly. A `.assetsignore` file is skipped too, but its patterns aren't applied.
- Cloudflare limits each file to 25 MiB, and a Worker to 20,000 files on the Free plan (100,000 on Paid). Workers allows 100 `_headers` rules and 2,100 `_redirects` rules.
- `CloudflareR2Deployer` uploads generated files but does not delete old objects that were removed from the site.
- Cloudflare Pages Direct Upload targets must be Direct Upload projects rather than Git-connected Pages projects.
- Credentials typed into the fields are stored in the `XStaticDeploymentTargets` database table like other deployers; restrict access to the `xStaticAdmin` group ([User groups and security](User-Groups-and-Security.md)). Type `${env:XSTATIC_CLOUDFLARE_API_TOKEN}` (or `${env:XSTATIC_R2_SECRET_ACCESS_KEY}`) instead to keep them in environment variables ([Secrets and environment variables](Secrets-and-Environment-Variables.md)).

## Next steps

- Pair Cloudflare with companion `.md` files using [AI and GEO](AI-and-GEO.md).
- Compare other deployers on [Deployment targets](Deployment-Targets.md).
- See [Post-generation actions](Post-Generation-Actions.md) for how actions run during generation.
