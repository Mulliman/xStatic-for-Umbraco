# Configuration

xStatic reads its global settings from the `XStatic` section of `appsettings.json` (bound to
`XStatic.Core.App.XStaticGlobalSettings`). All settings are optional.

```json
{
  "XStatic": {
    "TrustSslWhenGenerating": false,
    "ExcludeGeneratingDocTypes": [ "redirectPage" ],
    "DoNotDeletePaths": [ ".git", "CNAME", ".well-known" ]
  }
}
```

| Setting | Default | What it does |
|---------|---------|--------------|
| `TrustSslWhenGenerating` | `false` | Accept any SSL certificate when xStatic fetches pages from the running site. Useful for local or Linux setups with self-signed certificates. |
| `ExcludeGeneratingDocTypes` | none | Document type aliases whose pages are not generated. |
| `DoNotDeletePaths` | `.git`, `CNAME` | Files and folders kept when a site's stored output is cleared. A path is kept when it ends with one of these values. Setting this list **replaces** the defaults, so include `.git` and `CNAME` if you still need them. |
| `UseXStaticUserRoles`, `RoleCreationUser`, `RoleCreationUseRootUser` | set by xStatic | Control the xStatic user groups. The automatic setup turns these on; see below. |

## Setting them in code

If you register xStatic yourself (see [Extending xStatic](Extending%20xStatic.md)), the builder has a method for
each setting:

```csharp
services.AddXStatic()
    .Automatic()
    .UseSecureUserGroups()
    .TrustUnsafeSslConnectionWhenGenerating()
    .ExcludeGeneratingDocTypes(new List<string> { "redirectPage" })
    .DoNotDeletePathsWhenClearing(".git", "CNAME", ".well-known")
    .Build();
```

Values set in code are applied after `appsettings.json`, so they win when both are set.

> Before xStatic 17.3.0 / 18.0.0, `DoNotDeletePaths` was read from `xStatic.DoNotDeletePaths` in the .NET Framework
> `app.config`, which modern Umbraco sites don't have, so it never took effect. Move any value you had there to
> `XStatic:DoNotDeletePaths` in `appsettings.json`.
