Reference for the HTTP API behind the xStatic backoffice. Use it to generate and deploy sites from scripts or other
applications, to build your own tooling, or to understand what the backoffice is doing. It lists every endpoint,
how to authenticate, and working examples.

## At a glance

- 24 endpoints in 7 controllers, all under `/api/v1/xstatic/`.
- JSON in and out, with camelCase property names.
- Every endpoint needs a backoffice access token. Some need the `xStaticAdmin` role. The rest need `xStaticNormalUser`
  or `xStaticAdmin`.
- The OpenAPI document is named `xstatic-v1` and lives at `/umbraco/openapi/xstatic-v1.json`.
- The [`xStatic.RemoteOperations`](../Source/XStaticCore/XStatic.RemoteOperations/XStaticRemoteOperationsClient.cs)
  NuGet package is a ready-made .NET client for the generate-and-deploy calls.

## Authentication

xStatic's endpoints use Umbraco's backoffice authentication, the same OpenID Connect tokens the backoffice itself
uses. Send the token as a bearer token:

```text
Authorization: Bearer YOUR-TOKEN
```

There are two ways to get one:

- **In the backoffice:** the xStatic screens do it for you. You never handle a token.
- **From code:** use an Umbraco **API user** and the client credentials flow, as shown [below](#get-a-token-and-generate-a-site).

Without a token every endpoint returns `401 Unauthorized`. The Playwright suite checks this for all 24 endpoints.

### Who can call what

| Policy | Role needed | Applies to |
|--------|-------------|------------|
| Normal user | `xStaticNormalUser` or `xStaticAdmin` | Sites, generate, deploy, download, config |
| Admin | `xStaticAdmin` | Deployment targets, actions |

The roles are Umbraco user group aliases. With xStatic's default setup the caller must be in the right group.
If you register xStatic without `UseSecureUserGroups()`, both policies only require a signed-in user. See
[User groups and security](User-Groups-and-Security.md).

### Conventions

- Routes below are relative to `https://your-site/api/v1/xstatic`. They are not under `/umbraco/management/`.
- `{id}` style query values are passed as query strings, for example `?staticSiteId=1`.
- Errors the code raises on purpose (such as deploying before generating) are unhandled exceptions, so they come back
  as a `500` response. Whether the body shows the message depends on how your site handles exceptions, and the
  exception is logged either way. A failed *generate* is different: see the notes on [generate](#generate).
- The bodies are the C# models in
  [`XStatic.Core.Models`](../Source/XStaticCore/XStatic.Core/Models/SiteUpdateModel.cs), serialised in camelCase.

## Endpoints

### Sites

`SitesController`, route `sites`, normal user.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| GET | `sites/get-all` | none | list of `SiteApiModel` | All sites, with the export type name, the root node's path (**Item Not Found** if the node isn't published or has been deleted), and the stored output size (only worked out when the root node is found) |
| GET | `sites/{staticSiteId}` | route | `SiteApiModel` | Single site configuration and status by ID (`404` if not found) |
| POST | `sites/create` | body `SiteUpdateModel` | `SiteApiModel` | Creates a site |
| POST | `sites/update` | body `SiteUpdateModel` with `id` | `SiteApiModel` | Updates a site |
| DELETE | `sites/delete?staticSiteId={id}` | query | empty | Deletes the site's settings. The stored output stays on disk |
| DELETE | `sites/clear-stored-site?staticSiteId={id}` | query | list of `SiteApiModel` | Deletes the site's stored output (the **Clean** button), keeping `XStatic:DoNotDeletePaths` |
| GET | `sites/get-site-dependencies` | none | `{ actions, exportTypes, deployers }` | Lists export types, actions and deployment targets for the site dialog: id and name for each, plus the deployer id for targets and the generator, transformer factory and file name generator for export types. No secrets |

`SiteUpdateModel` has `id`, `name`, `autoPublish`, `rootNode` (a GUID), `mediaRootNodes` (GUIDs), `exportFormat` (an
export type id), `assetPaths` and `imageCrops` (comma-separated strings), `targetHostname`, `deploymentTarget` (an id or
null), `postGenerationActionIds` (ids) and `cultures` (culture codes). [Sites](Sites.md) explains each field.
`SiteApiModel` (in the `XStatic.Models` namespace) adds `lastRun`, `lastBuildDurationInSeconds`, `lastDeployed`, `lastDeployDurationInSeconds`, `rootPath`,
`exportTypeName` and `folderSize`.

`create` and `update` do no validation of their own, so a request with an empty name or an unknown export format is saved as
sent. The backoffice dialog checks those fields before it calls the API.

### Generate

`GenerateController`, route `generate`, normal user.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| POST | `generate/generate-site?staticSiteId={id}` | query | `RebuildProcessResult` | Builds the site: pages, media, assets, crops and post-generation actions |

`RebuildProcessResult` has `wasSuccessful`, `results` (one entry per item), `warnings` (the failed entries),
`siteId`, `buildTime` (milliseconds), `exception` and `exceptionTrace`. Each result is
`{ wasSuccessful, type, item, message }`, where `type` is `Page`, `Media`, `Folder`, `File`, `Asset` or `PostAction`.

The call returns **200 even when generation fails**. (An unknown site id is the exception: that is a `500`.) Always check `wasSuccessful` in the body. A run where only some
items failed has `wasSuccessful: false` and the failures listed in `warnings`, and the pages that worked are still
stored.

### Deploy

`DeployController`, route `deploy`, normal user.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| POST | `deploy/deploy-site?staticSiteId={id}` | query | `{ wasSuccessful, message, exception }` | Sends the stored output to the site's deployment target |

The call fails with a `500` error if the site isn't found, has no generated output ("Generate the site before
deploying."), has no deployment target, or its target can't be found. A deployer that runs but fails returns
200 with `wasSuccessful: false`, so check the body here as well.

### Download

`DownloadController`, route `download`, normal user.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| GET | `download/download-site?staticSiteId={id}` | query | `application/zip` file named `xStatic site download {id}.zip` | Zips the stored output and streams it |

The zip is also left on disk next to the site's output folder, in `umbraco/Data/xStatic/output`, and is replaced on the next download. The call fails with a `500` error if the site isn't found or has no generated output.

### Config and export types

`XStaticConfigController`, route `config`, normal user.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| GET | `config/get-settings` | none | `{ isUsingXStaticRoles, allowedSecretEnvironmentVariables, allowedSecretConfigurationKeys }` | Whether the xStatic user groups are on (the UI uses it to decide which tabs to show), and the effective name patterns that `${env:...}` and `${config:...}` [secret references](Secrets-and-Environment-Variables.md) may read. The patterns are shown as a hint on password fields; resolved values are never returned |
| GET | `config/get-config` | none | `XStaticConfig` | The installed components: deployers, deployment target creators, export types, generators, transformer factories, file name generators and post-generation actions |
| POST | `config/create-export-type` | body `ExportTypeUpdateModel` | `ExportTypeModel` | Creates an [export type](Export-Types.md) |
| POST | `config/update-export-type` | body `ExportTypeUpdateModel` with `id` | `ExportTypeModel` | Updates one |
| DELETE | `config/delete-export-type?id={id}` | query | empty | Deletes one. It doesn't check whether sites use it |

`ExportTypeUpdateModel` is `{ id, name, transformerFactory, generator, fileNameGenerator }`. The last three are
**assembly-qualified type names**, the `id` values `get-config` returns for the generators, transformer factories and
file name generators.

The export type endpoints use the normal-user policy on purpose, so editors can manage export types.

### Actions

`ActionsController`, route `actions`, admin.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| GET | `actions/get-post-actions` | none | list of `ActionModel` | All saved [post-generation actions](Post-Generation-Actions.md) with their settings |
| POST | `actions/create-post-action` | body `ActionUpdateModel` | `ActionModel` | Creates one |
| POST | `actions/update-post-action` | body `ActionUpdateModel` with `id` | `ActionModel` | Updates one |
| DELETE | `actions/delete-post-action?id={id}` | query | empty | Deletes one |

`ActionUpdateModel` is `{ id, name, type, config }`, where `type` is an action's assembly-qualified name (from
`get-config`) and `config` is an object of setting names to values, such as `{ "FilePath": "...", "NewFilePath": "..." }`.

### Deployment targets

`DeploymentTargetController`, route `deployment-targets`, admin.

| Verb | Route | Request | Response | What it does |
|------|-------|---------|----------|--------------|
| GET | `deployment-targets/get-deployment-targets` | none | list of `DeploymentTargetModel` | All targets, with each field's **current value, including passwords and tokens** |
| POST | `deployment-targets/create-deployment-target` | body `DeploymentTargetUpdateModel` | `DeploymentTargetModel` | Creates a target |
| POST | `deployment-targets/update-deployment-target` | body `DeploymentTargetUpdateModel` with `id` | `DeploymentTargetModel` | Updates a target |
| DELETE | `deployment-targets/delete-deployment-target?id={id}` | query | empty | Deletes a target |
| POST | `deployment-targets/auto-create-deployment-target` | body `DeploymentTargetCreatorPostModel` | 201 with `{ wasSuccessful, message, exception, data }` | Runs a creator (such as the Netlify Site Creator) and saves the target it makes |

`DeploymentTargetUpdateModel` is `{ id, name, deployerDefinition, fields }`, where `deployerDefinition` is the
deployer's id (`filesystem`, `netlify`, `netlify-legacy`, `git`, `ftp`, `cloudflare-workers`, `cloudflare-pages`, `cloudflare-r2`) and `fields` maps each field's alias to its value, for example
`{ "File.FolderPath": "C:\\Temp\\site" }`. `DeploymentTargetCreatorPostModel` is `{ name, creator, fields }`. Use
`netlify-site-creator` as the `creator` id, with the fields `NetlifyCreator.PAT` (a Netlify personal access token) and
`NetlifyCreator.SiteName`. The creator names the new target after the site name, so `name` is ignored. With
`xStatic.Cloudflare` installed you can also use `cloudflare-workers-creator`, with the fields
`CloudflareWorkersCreator.AccountId`, `CloudflareWorkersCreator.ApiToken` and `CloudflareWorkersCreator.WorkerName`
(it returns 409 if a Worker with that name already exists), or `cloudflare-pages-project-creator`, with the fields
`CloudflarePagesCreator.AccountId`, `CloudflarePagesCreator.ApiToken`, `CloudflarePagesCreator.ProjectName` and
`CloudflarePagesCreator.ProductionBranch` (optional, `main` if blank). The
`DeploymentTargetModel` that comes back has `id`, `name`, `deployerDefinition`, `help` and `fields`, where `fields` is
a list of `{ alias, name, editorUiAlias, value, help }`, not a map.

`get-deployment-targets` leaves out any target whose deployer isn't installed. `auto-create-deployment-target`
returns 409 when the creator throws an `XStaticException`, such as the Netlify creator's "site name already taken" error. Any other exception (a blank field in the Netlify creator, or a `creator` id that isn't installed) is a `500`. `create-deployment-target` and `update-deployment-target` save whatever `deployerDefinition` you send; if that deployer isn't installed, the response body is empty.

See [Deployment targets](Deployment-Targets.md) for the field names for each deployer.

## Get a token and generate a site

First create an API user. See [User groups and security](User-Groups-and-Security.md#api-users-for-remote-operations).
Put it in the `xStaticNormalUser` group. When you create its client credential you choose an **Id** and a **Secret**; the client id you send is `umbraco-back-office-` followed by that Id (see [Remote operations](Remote-Operations.md#step-1-create-an-api-user-in-umbraco)). In these examples the client id is `umbraco-back-office-xstatic-scheduler`, the site is at
`https://localhost:44359` and the site to build has id `1`.

### curl

```bash
# 1. Get a token. -k trusts the local development certificate.
TOKEN=$(curl -sk -X POST "https://localhost:44359/umbraco/management/api/v1/security/back-office/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=umbraco-back-office-xstatic-scheduler" \
  -d "client_secret=YOUR-CLIENT-SECRET" | sed -E 's/.*"access_token":"([^"]+)".*/\1/')

# 2. Generate site 1.
curl -sk -X POST "https://localhost:44359/api/v1/xstatic/generate/generate-site?staticSiteId=1" \
  -H "Authorization: Bearer $TOKEN"

# 3. Deploy it.
curl -sk -X POST "https://localhost:44359/api/v1/xstatic/deploy/deploy-site?staticSiteId=1" \
  -H "Authorization: Bearer $TOKEN"
```

### PowerShell

```powershell
$base = "https://localhost:44359"

# 1. Get a token. The body is sent as a form, which is what the token endpoint expects.
$token = (Invoke-RestMethod -Method Post -Uri "$base/umbraco/management/api/v1/security/back-office/token" `
    -Body @{
        grant_type    = "client_credentials"
        client_id     = "umbraco-back-office-xstatic-scheduler"
        client_secret = "YOUR-CLIENT-SECRET"
    }).access_token

$headers = @{ Authorization = "Bearer $token" }

# 2. Generate site 1 and check the result.
$build = Invoke-RestMethod -Method Post -Headers $headers `
    -Uri "$base/api/v1/xstatic/generate/generate-site?staticSiteId=1"

if (-not $build.wasSuccessful) {
    $build.warnings | ForEach-Object { "$($_.type) $($_.item): $($_.message)" }
    throw "Generation failed"
}

# 3. Deploy it.
$deploy = Invoke-RestMethod -Method Post -Headers $headers `
    -Uri "$base/api/v1/xstatic/deploy/deploy-site?staticSiteId=1"

$deploy.message
```

Add `-SkipCertificateCheck` to `Invoke-RestMethod` if you are using a local development certificate.

The token is short-lived. The response includes `expires_in` in seconds, so request a new one for each run rather
than storing it.

## The .NET client

`xStatic.RemoteOperations` wraps the steps above: it gets a token, lists the sites, then generates and deploys them.
It has no dependency on `xStatic.Core`.

```powershell
dotnet add package xStatic.RemoteOperations
```

```csharp
using XStatic.RemoteOperations;

var client = new XStaticRemoteOperationsClient(
    baseUri: "https://my-umbraco-site.example",   // no trailing slash
    clientId: "umbraco-back-office-xstatic-scheduler",
    clientSecret: "YOUR-CLIENT-SECRET");

// Generate and deploy one site by id...
BuildDeployResult result = await client.GenerateAndDeploySite(1);

Console.WriteLine(result.RebuildProcessResult?.WasSuccessful);
Console.WriteLine(result.DeployProcessResult?.Message);
Console.WriteLine(result.Exception);

// ...or every site.
await foreach (var siteResult in client.GenerateAndDeployAllSites())
{
    Console.WriteLine(siteResult.RebuildProcessResult?.SiteId);
}
```

For anything else, `GetAutoGeneratedClient()` returns the generated `Client` with a method for each endpoint above,
such as `GetAllAsync()`, `GenerateSiteAsync(int?)` and `DeploySiteAsync(int?)`. The client file is generated by NSwag
from the OpenAPI document and shouldn't be edited by hand. A site with no deployment target is generated but not
deployed, and a failed generate doesn't stop the deploy step. See [Remote operations](Remote-Operations.md) for
scheduling and the full workflow.

## The OpenAPI document

The OpenAPI document for xStatic's API is registered under the name `xstatic-v1` with the title **xStatic v1**:

```text
https://your-site/umbraco/openapi/xstatic-v1.json
```

Use it to generate a client in another language or inspect schemas for MCP tooling (see [MCP server and agent skill](MCP-Server-and-Agent-Skill.md)). Umbraco serves its OpenAPI documents from the same address as the
backoffice. If the URL returns a 404 in a published environment, check whether Umbraco's OpenAPI documents are only
enabled in development on your version.

The xStatic backoffice's own TypeScript client in the repository is kept in step with the controllers by hand
rather than by regenerating it. See [Developing xStatic](Developing-xStatic.md).

## Next steps

- [Remote operations](Remote-Operations.md): schedule builds with the client package.
- [User groups and security](User-Groups-and-Security.md): who can call what.
- [Architecture](Architecture.md): what generate and deploy do inside xStatic.
