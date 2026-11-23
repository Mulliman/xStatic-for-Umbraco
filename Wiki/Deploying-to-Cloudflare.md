Deploy your static Umbraco site directly to **Cloudflare Pages** (via the Direct Upload API, with no Git repository required) or **Cloudflare R2** (via Cloudflare's S3-compatible API). This guide covers installing `xStatic.Cloudflare`, configuring targets in the backoffice, provisioning projects automatically, and generating `_headers` and `_redirects` files.

## Install the package

From your Umbraco project folder, run:

```powershell
dotnet add package xStatic.Cloudflare
```

When you use xStatic's default automatic setup, restarting the site automatically discovers:

- **Cloudflare Pages** deployer (`cloudflare-pages`)
- **Cloudflare Pages Project Creator** (`cloudflare-pages-project-creator`)
- **Cloudflare R2** deployer (`cloudflare-r2`)
- **CloudflareHeadersAction** and **CloudflareRedirectsAction** post-generation actions

You don't need to edit `Program.cs` unless you register xStatic manually. If you do configure xStatic yourself, add the deployers and optional actions to your builder:

```csharp
using XStatic.Cloudflare;
using XStatic.Core.App;

var xStatic = builder.Services.AddXStatic()
    .Automatic();
xStatic.DeployServiceBuilder.AddCloudflareDeployers();
xStatic.Build();

builder.Services.AddCloudflareActions();
```

## Deploy to Cloudflare Pages

`CloudflarePagesDeployer` ([source](../Source/XStaticCore/XStatic.Cloudflare/CloudflarePagesDeployer.cs)) uses Cloudflare's Direct Upload flow: it requests a short-lived upload JWT, hashes every generated file, uploads only missing or changed files in batches with accurate MIME types (including `text/markdown; charset=utf-8` for `.md` files), registers asset hashes, and creates a deployment with any `_headers` or `_redirects` files.

### Step 1: Create a Cloudflare API token

1. Sign in to the Cloudflare dashboard and open **My Profile > API Tokens** (`https://dash.cloudflare.com/profile/api-tokens`).
2. Select **Create Token** and grant **Account > Cloudflare Pages: Edit**.
3. Copy the token and note your **Account ID** from the Cloudflare dashboard URL or the **Workers & Pages** overview.

### Step 2: Create a deployment target (or provision a new project)

If you already have a Cloudflare Pages Direct Upload project:

1. Open **xStatic > Deployment Targets** and select **Create new Deployment Target**.
2. Enter a **Name**, choose **Cloudflare Pages** as the **Deployer**, and fill in the fields:

| Field | Required | Notes |
|-------|----------|-------|
| **Account ID** | Yes | Your Cloudflare Account ID. |
| **API Token** | Yes | Token with **Cloudflare Pages: Edit** permission. |
| **Project Name** | Yes | Existing Cloudflare Pages project name. |
| **Branch (optional)** | No | Leave blank for the production branch, or enter a preview branch name. |
| **Generate AI/Markdown `_headers`** | No | When enabled and no `_headers` file exists in the output, writes a `_headers` file with `Vary: Accept` and `Content-Type: text/markdown; charset=utf-8` for `/*.md` to support Cloudflare's *Markdown for Agents*. |

3. Select **Submit**, assign the target to your site, generate, and select **Deploy**.

To create a brand-new Cloudflare Pages project from the backoffice instead, select **Auto Create Deployment Target** in **xStatic > Deployment Targets**, pick **Cloudflare Pages Project Creator**, and supply your Account ID, API Token, Project Name, and optional Production Branch. xStatic calls Cloudflare's API to create the project and saves a matching deployment target for you.

## Deploy to Cloudflare R2

`CloudflareR2Deployer` ([source](../Source/XStaticCore/XStatic.Cloudflare/CloudflareR2Deployer.cs)) uploads generated files directly to an R2 bucket using AWS Signature Version 4 (`AwsSigV4Signer`) against `https://{accountId}.r2.cloudflarestorage.com`.

1. In the Cloudflare dashboard, open **R2 Object Storage > Manage R2 API Tokens** and create a token with **Object Read & Write** permission for your bucket. Note the **Access Key ID** and **Secret Access Key**.
2. In Umbraco, open **xStatic > Deployment Targets** and select **Create new Deployment Target**.
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

`xStatic.Cloudflare` includes two post-generation actions you can configure in **xStatic > Actions**:

- **`CloudflareHeadersAction`**: writes `/_headers` into the generated site root. You can enable the built-in *Markdown for Agents* rules (**IncludeMarkdownForAgents**) and append custom Cloudflare Pages header rules (**CustomRules**).
- **`CloudflareRedirectsAction`**: writes `/_redirects` into the generated site root from your configured redirect rules (**Rules**).

These actions run locally during generation, so you can inspect the generated `_headers` and `_redirects` files in `umbraco/Data/xStatic/output/{siteId}/` even before connecting a live Cloudflare account.

## Limitations

- `CloudflareR2Deployer` uploads generated files but does not delete old objects that were removed from the site.
- Cloudflare Pages Direct Upload targets must be Direct Upload projects rather than Git-connected Pages projects.
- Credentials are stored in the `XStaticDeploymentTargets` database table like other deployers; restrict access to the `xStaticAdmin` group ([User groups and security](User-Groups-and-Security.md)).

## Next steps

- Pair Cloudflare Pages with companion `.md` files using [AI and GEO](AI-and-GEO.md).
- Compare other deployers on [Deployment targets](Deployment-Targets.md).
- See [Post-generation actions](Post-Generation-Actions.md) for how actions run during generation.
