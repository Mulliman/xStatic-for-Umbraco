# xStatic backoffice client

This folder holds the xStatic backoffice UI for Umbraco 14 and later.

- `XStatic14.Client/` is a Razor Class Library (NuGet package `xStatic.Client`). The TypeScript and Lit source is in
  `XStatic14.Client/assets/src`, and Vite builds it into `XStatic14.Client/wwwroot/App_Plugins/xstatic14`.
- `XStatic14/` is an empty project that only references the client. Don't add code to it.
- `XStatic14.Website/` is a placeholder for a local test website. Use `Testing/Instances/AddNew.bat` instead.

From `XStatic14.Client/assets`:

```powershell
npm ci
npm run check   # type-check, lint and unit tests
npm run build   # build into wwwroot/App_Plugins/xstatic14
npm run watch   # rebuild on save, for use with a local test instance
```

How the client is organised, and the conventions it follows, are described in the "Front-end" section of
[Developing xStatic](../../../Wiki/Developing-xStatic.md). The local test instance workflow is in
[CONTRIBUTING.md](../../../CONTRIBUTING.md).
