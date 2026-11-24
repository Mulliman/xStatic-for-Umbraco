Deployment targets and post-generation actions often need a password or token. You can type the secret straight into
the field, but then xStatic stores it in the database in plain text. A safer way is to keep the secret in an
environment variable (or another configuration source, such as Azure Key Vault) on the server and type a short
reference, such as `${env:XSTATIC_NETLIFY_TOKEN}`, in the field instead. This page explains the format, how to set it
up and which variables xStatic is allowed to read. It's for admins who set up deployment targets and for developers
who look after the server.

## At a glance

- Type `${env:NAME}` in any deployment target or action field to read the environment variable `NAME`.
- Type `${config:Section:Key}` to read a key from the site's configuration (`appsettings.json`, user secrets, Azure
  Key Vault and any other configuration provider the site uses).
- Only the reference is saved. xStatic reads the real value each time it deploys or runs the action, and never sends it
  to the browser.
- **By default xStatic only reads environment variables whose names start with `XSTATIC_`, and configuration keys
  under `XStatic:Secrets`.** A developer has to allow anything else on purpose. See
  [Which variables xStatic can read](#which-variables-xstatic-can-read).
- Values without a reference work exactly as before, so existing targets don't change. The one exception is `$${`,
  which is now read as a literal `${`.

## Why a reference is safer

When you type a secret into a field:

- It's saved in the `Config` column of the `XStaticDeploymentTargets` (or `XStaticActions`) table as plain text. Anyone
  who can read the database, or a backup or copy of it, can read the secret.
- It's sent back to the browser whenever an admin opens **Deployment Targets**, because the edit dialog shows the
  current values. The masked box hides it on screen, not in the response.

When you type a reference instead, the database and the browser only ever see `${env:XSTATIC_NETLIFY_TOKEN}`. The secret
stays where your hosting already keeps secrets, and you can change it there without touching xStatic.

The backoffice reminds you of this. Fields that hold a secret show a line underneath that recommends a reference, and a
warning if you've typed a secret in directly. Forms with a secret field also show a box headed **Keep passwords and
tokens out of the database.**

## The format

| You type | xStatic uses |
|----------|--------------|
| `${env:XSTATIC_NETLIFY_TOKEN}` | The value of the environment variable `XSTATIC_NETLIFY_TOKEN` |
| `${config:XStatic:Secrets:NetlifyToken}` | The value of the configuration key `XStatic:Secrets:NetlifyToken` |
| `https://${env:XSTATIC_GIT_USER}:${env:XSTATIC_GIT_TOKEN}@github.com/org/repo.git` | The URL with both values filled in. A reference can sit anywhere inside a value |
| `$${env:XSTATIC_NETLIFY_TOKEN}` | The text `${env:XSTATIC_NETLIFY_TOKEN}` exactly. `$${` writes a literal `${` |
| `my-password` | `my-password`. Values without a reference are used as they are |

Things to know:

- `env:` and `config:` can be in any case. Spaces around the name are ignored.
- Anything else in `${...}`, such as `${something}`, is left as it is.
- Configuration keys use `:` between sections, as in `appsettings.json` paths.
- Environment variable names are case-sensitive on Linux and not on Windows, as usual for each system.

## Use an environment variable

This example moves a Netlify token out of the database. The same steps work for any deployer or action field.

1. **Set the environment variable on the server.** Give it a name starting with `XSTATIC_`, such as
   `XSTATIC_NETLIFY_TOKEN`, and the token as its value. Where you set it depends on your hosting:

   | Hosting | Where to set it |
   |---------|-----------------|
   | Azure App Service | **Settings > Environment variables > App settings**. App settings are passed to the site as environment variables |
   | IIS | The site's `web.config`, inside `<aspNetCore>`, or the application pool's environment variables |
   | Docker | `-e XSTATIC_NETLIFY_TOKEN=...` or the `environment:` section of `docker-compose.yml`, ideally from a secrets file |
   | Kubernetes | An `env` entry that reads from a `Secret` |
   | Your own machine | `Properties/launchSettings.json` under `environmentVariables`, or your shell |

   In IIS, for example:

   ```xml
   <aspNetCore processPath="dotnet" arguments=".\MySite.dll">
     <environmentVariables>
       <environmentVariable name="XSTATIC_NETLIFY_TOKEN" value="YOUR-TOKEN" />
     </environmentVariables>
   </aspNetCore>
   ```

2. **Restart the site** if your host doesn't do it for you. A running process only sees environment variables that were
   set before it started. Azure App Service restarts the site when you save app settings; IIS needs an application pool
   recycle.
3. Open **xStatic > Deployment Targets** and edit the target (or create a new one).
4. In **Personal Access Token**, type `${env:XSTATIC_NETLIFY_TOKEN}`. The line under the field turns green and says the
   value is read from the environment variable.
5. Click **Submit**, then deploy a site that uses the target to check it works.

If the line under the field says the variable isn't allowed on this site, the name doesn't match the allow-list. Rename
the variable or ask a developer to allow it. See the next section.

## Which variables xStatic can read

Anyone who can edit a deployment target can choose where it deploys to. If xStatic let them read any environment
variable, they could type `${env:SOME_OTHER_SECRET}` into the FTP **Password** field, point **Hostname** at their own
server and deploy, which would send that secret to them. Servers hold other secrets in environment variables (the
database connection string, cloud credentials), so xStatic starts with a short allow-list:

| Setting | Default | What it allows |
|---------|---------|----------------|
| `XStatic:Secrets:AllowedEnvironmentVariables` | `XSTATIC_*` | Environment variables `${env:...}` may read |
| `XStatic:Secrets:AllowedConfigurationKeys` | `XStatic:Secrets:*` | Configuration keys `${config:...}` may read |

Patterns use `*` for any run of characters and `?` for one character, and ignore case. Setting a list **replaces** its
default, so include `XSTATIC_*` if you still want it. An empty list means "use the default".

To allow more, set the lists in `appsettings.json`:

```json
{
  "XStatic": {
    "Secrets": {
      "AllowedEnvironmentVariables": [ "XSTATIC_*", "NETLIFY_AUTH_TOKEN", "GITHUB_DEPLOY_*" ],
      "AllowedConfigurationKeys": [ "XStatic:Secrets:*", "Deploy:*" ]
    }
  }
}
```

Or in code, if you [register xStatic yourself](Extending-xStatic.md):

```csharp
using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .UseSecureUserGroups()
    .AllowSecretEnvironmentVariables("XSTATIC_*", "NETLIFY_AUTH_TOKEN")
    .AllowSecretConfigurationKeys("XStatic:Secrets:*")
    .Build();
```

`"*"` allows every environment variable. Only use it if everyone who can edit deployment targets is allowed to see every
secret on the server. Restart the site after changing these settings.

The backoffice shows the patterns in force on this site in the tip above secret fields, so admins know which names they
can use.

## Use a configuration key or Azure Key Vault

`${config:...}` reads the site's .NET configuration, so it works with every configuration source the site has. Keep
secrets under `XStatic:Secrets` so the default allow-list covers them.

- **Environment variables, in configuration form.** `XStatic__Secrets__NetlifyToken` becomes the key
  `XStatic:Secrets:NetlifyToken`. Type `${config:XStatic:Secrets:NetlifyToken}`.
- **User secrets** on a developer's machine: `dotnet user-secrets set "XStatic:Secrets:NetlifyToken" "YOUR-TOKEN"`.
- **Azure Key Vault.** Add the vault as a configuration source in `Program.cs`, using the
  `Azure.Extensions.AspNetCore.Configuration.Secrets` and `Azure.Identity` packages:

  ```csharp
  using Azure.Identity;

  builder.Configuration.AddAzureKeyVault(
      new Uri("https://YOUR-VAULT.vault.azure.net/"),
      new DefaultAzureCredential());
  ```

  Name the secret `XStatic--Secrets--NetlifyToken` in the vault (Key Vault names can't contain `:`, and `--` stands in
  for it) and type `${config:XStatic:Secrets:NetlifyToken}` in the field.
- **AWS Secrets Manager, HashiCorp Vault and others** work the same way through their configuration providers.

Configuration providers usually load values when the site starts, so restart the site, or use the provider's reload
option, after you change a secret.

## When references are read

- **Deploying:** just before the deployer is created, every time you click **Deploy**, auto publish deploys, or the
  [AI tools](AI-Integration.md) or [remote operations](Remote-Operations.md) deploy.
- **Post-generation actions:** just before each action runs.
- **Creating a target automatically:** the [deployment target creators](Deployment-Target-Creators.md) receive the real
  values so they can call Netlify or Cloudflare. If you typed a reference in the creator's token field, the new target
  is saved with the same reference, not the token.

The real values only exist in memory while xStatic uses them. They aren't saved, and the deployment target and action
endpoints only ever return the reference. xStatic writes the names it read, never the values, to the log at information
level, for example `xStatic read env:XSTATIC_NETLIFY_TOKEN for field Netlify.PAT.`

Once a deployer, creator or action has the value, what it does with it is up to that code. The Git deployer hides its
password and URL credentials in error messages. A third-party deployer that puts a secret in an error message would
show it in the deploy result and the log, as it would for a typed-in secret.

## Errors

A reference that can't be read stops the deploy (or that action) with a message that names the variable and the field,
never the value.

| Message | What to do |
|---------|------------|
| `Failed to deploy. The environment variable 'NAME' (used in 'Netlify.PAT') isn't allowed. Rename it to match one of 'XSTATIC_*', or add it to XStatic:Secrets:AllowedEnvironmentVariables in appsettings.json.` | Rename the variable to match the allow-list, or [allow it](#which-variables-xstatic-can-read) |
| `The environment variable 'NAME' (used in '...') isn't set on this server. Set it and restart the site if your host needs that.` | Check the name, set the variable and restart the site |
| `The configuration key 'KEY' (used in '...') isn't allowed. ...` | Move the key under `XStatic:Secrets`, or add it to `XStatic:Secrets:AllowedConfigurationKeys` |
| `The configuration key 'KEY' (used in '...') has no value on this server.` | Check the key and that the configuration source (for example Key Vault) is loaded |

For an action, the message appears against the action's name in the generation results, and the other actions still run.

## Limitations

- References are checked when they're used, not when you save. The line under a secret field warns about names outside
  the allow-list, but it can't tell whether the variable is actually set on the server.
- Existing targets keep their typed-in secrets until you edit them. Nothing is converted automatically.
- Only fields that use the password editor show the hint, but references work in every field, including **Remote URL**.
- The allow-list limits what can be read, not where it's sent. Anyone who can edit deployment targets can still send an
  allowed secret to a server of their choosing, so keep the `xStaticAdmin` group small
  ([User groups and security](User-Groups-and-Security.md)).

## For developers

Deployers, deployment target creators and post-generation actions don't need to change. They receive the same
`Dictionary<string, string>` as before, with references already replaced by their values. Resolution happens in
`DeployerService`, `ActionFactory` and the deployment target controller, through
[ISecretReferenceResolver](../Source/XStaticCore/XStatic.Core/Secrets/ISecretReferenceResolver.cs). The default
implementation is [SecretReferenceResolver](../Source/XStaticCore/XStatic.Core/Secrets/SecretReferenceResolver.cs).
To read secrets from somewhere else, register your own `ISecretReferenceResolver` before xStatic's builders run.

Mark any field that holds a secret with `UIEditors.Password`, so it gets the masked box and the hint. See
[Writing a deployer](Writing-a-Deployer.md#editors-you-can-use).

## Next steps

- [Deployment targets](Deployment-Targets.md#secrets-where-they-live-and-who-sees-them): who can see the values
- [Configuration](Configuration.md#secrets): the settings in one place
- [User groups and security](User-Groups-and-Security.md)
