# Cloudflare Deployers (`XStatic.Cloudflare`)

`XStatic.Cloudflare` adds edge-native deployment targets and post-generation actions for **Cloudflare Pages** (Direct Upload API) and **Cloudflare R2** (S3-compatible API) to xStatic for Umbraco (.NET 10 / Umbraco 17 LTS).

## Auto-Discovery & Registration

When `XStatic.Cloudflare` is referenced by your Umbraco site, xStatic's default automatic setup (`services.AddXStatic().Automatic().Build()`) automatically discovers:

- **Cloudflare Pages** deployer (`cloudflare-pages`) via `CloudflarePagesAutoInstaller`
- **Cloudflare Pages Project Creator** (`cloudflare-pages-project-creator`) via `CloudflarePagesAutoInstaller`
- **Cloudflare R2** deployer (`cloudflare-r2`) via `CloudflareR2AutoInstaller`

If you configure xStatic manually, you can register the deployers and optional post-generation actions with:

```csharp
builder.Services.AddXStatic()
    .DeployServiceBuilder.AddCloudflareDeployers();

builder.Services.AddCloudflareActions();
```

---

## Cloudflare Pages (Direct Upload)

`CloudflarePagesDeployer` deploys generated static files directly to Cloudflare Pages without requiring a Git repository or CI build step:

1. Requests a short-lived upload JWT from `/accounts/{accountId}/pages/projects/{projectName}/upload-token`.
2. Hashes every generated file and queries `/pages/assets/check-missing` so only changed or new files are uploaded.
3. Uploads missing assets in batches to `/pages/assets/upload` with accurate MIME types (including `text/markdown; charset=utf-8` for `.md` files).
4. Registers asset hashes via `/pages/assets/upsert-hashes`.
5. Creates a deployment at `/accounts/{accountId}/pages/projects/{projectName}/deployments` with the manifest, optional branch, and any `_headers` / `_redirects` files.

### Backoffice Configuration Fields

| Field | Alias | Required | Notes |
| --- | --- | --- | --- |
| **Account ID** | `CloudflarePages.AccountId` | Yes | Found in the Cloudflare dashboard URL or Workers & Pages overview. |
| **API Token** | `CloudflarePages.ApiToken` | Yes | Needs **Cloudflare Pages: Edit** permission. |
| **Project Name** | `CloudflarePages.ProjectName` | Yes | Target Cloudflare Pages project name. |
| **Branch** | `CloudflarePages.Branch` | No | Leave empty for the production branch, or enter a preview branch name. |
| **Generate AI/Markdown `_headers`** | `CloudflarePages.EnableMarkdownHeaders` | No | When enabled and no `_headers` file exists in the output, synthesizes a `_headers` file with `Vary: Accept` and `Content-Type: text/markdown; charset=utf-8` for `/*.md` to support Cloudflare's *Markdown for Agents* (`Accept: text/markdown`). |

### Cloudflare Pages Project Creator

Use the **Cloudflare Pages Project Creator** in the xStatic Deployment Targets backoffice UI to create a new Direct Upload project via Cloudflare's API and automatically populate a matching xStatic Deployment Target.

---

## Cloudflare R2

`CloudflareR2Deployer` uploads generated static files directly to a Cloudflare R2 bucket using AWS Signature Version 4 (`AwsSigV4Signer`) over Cloudflare's S3-compatible endpoint (`https://{accountId}.r2.cloudflarestorage.com`).

### Backoffice Configuration Fields

| Field | Alias | Required | Notes |
| --- | --- | --- | --- |
| **Account ID** | `CloudflareR2.AccountId` | Yes* | Required unless **Endpoint URL Override** is provided. |
| **Bucket Name** | `CloudflareR2.BucketName` | Yes | Target R2 bucket name. |
| **Access Key ID** | `CloudflareR2.AccessKeyId` | Yes | R2 API token Access Key ID with **Object Read & Write** permission. |
| **Secret Access Key** | `CloudflareR2.SecretAccessKey` | Yes | R2 API token Secret Access Key. |
| **Key Prefix** | `CloudflareR2.KeyPrefix` | No | Optional folder prefix inside the bucket (e.g. `site/`). |
| **Endpoint URL Override** | `CloudflareR2.EndpointOverride` | No | Optional custom S3 endpoint (for example, an EU jurisdiction endpoint `https://<accountId>.eu.r2.cloudflarestorage.com`). |

---

## Post-Generation Actions (`_headers` & `_redirects`)

Register `services.AddCloudflareActions()` to make two additional `[XStaticEditableField]` post-generation actions available in the backoffice:

- **`CloudflareHeadersAction`**: Writes `/_headers` into the generated site root. Supports toggling the built-in *Markdown for Agents* header rules (`IncludeMarkdownForAgents`) and appending custom Cloudflare Pages header rules (`CustomRules`).
- **`CloudflareRedirectsAction`**: Writes `/_redirects` into the generated site root from configured redirect rules (`Rules`).
