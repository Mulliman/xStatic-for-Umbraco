---
name: xstatic-umbraco
description: Build custom IGenerator, ITransformer / ITransformerListFactory, IPostGenerationAction, and IDeployer plugins for xStatic for Umbraco v17+ (.NET 10, Bellissima UI) without falling back to legacy v13 patterns.
---

# xStatic for Umbraco v17+ Extension Guide

Use this skill whenever creating or modifying xStatic plugins, custom generators, HTML/JSON transformers, post-generation actions, or deployment providers for **Umbraco 17+ / .NET 10**.

## Critical v17+ vs Legacy v13 Rules

Do **not** generate legacy Umbraco 13 patterns:

1. **Target Framework & Packages**: Target `net10.0` with `Umbraco.Cms.Core` `17.x` and `XStatic.Core`.
2. **Bellissima Property Editor Aliases (`XStatic.UIEditors`)**:
   - In `DeployerField.EditorUiAlias` and `[XStaticEditableField(name, editorUiAlias)]`, ALWAYS use `XStatic.UIEditors` constants (`Umb.PropertyEditorUi.*` / `xstatic.propertyEditorUi.password`):
     - `UIEditors.Text` (`"Umb.PropertyEditorUi.TextBox"`)
     - `UIEditors.TextArea` (`"Umb.PropertyEditorUi.TextArea"`)
     - `UIEditors.Password` (`"xstatic.propertyEditorUi.password"`) — use for all API tokens, PATs, passwords
     - `UIEditors.Integer` (`"Umb.PropertyEditorUi.Integer"`)
     - `UIEditors.Decimal` (`"Umb.PropertyEditorUi.Decimal"`)
     - `UIEditors.Toggle` (`"Umb.PropertyEditorUi.Toggle"`)
     - `UIEditors.Email` (`"Umb.PropertyEditorUi.Email"`)
     - `UIEditors.Tags` (`"Umb.PropertyEditorUi.Tags"`)
     - `UIEditors.StaticFilePicker` (`"Umb.PropertyEditorUi.StaticFilePicker"`)
   - NEVER use legacy v13 AngularJS view paths (`"/App_Plugins/..."`) or v13 editor aliases (`"Umbraco.TextBox"`).
3. **GUID Content & Media Keys**: `SiteConfig.RootNode` is `Guid` (not `int`), and `MediaRootNodes` stores comma-delimited `Guid` keys.
4. **Discovery + Dependency Injection**:
   - `GeneratorList`, `TransformerList`, `FileNameGeneratorList`, and `PostGenerationActionsList` discover concrete types via reflection across loaded assemblies.
   - At runtime, `DatabaseExportTypeService` and `ActionFactory` resolve types from `IServiceProvider` **first**, falling back to `Activator.CreateInstance(type)`.
   - Therefore, any `IGenerator`, `ITransformerListFactory`, `IFileNameGenerator`, or `IPostGenerationAction` with constructor-injected dependencies **MUST** be registered in DI inside an Umbraco `IComposer`!
   - `IDeployer` plugins are discovered automatically when you implement `IDeployerAutoInstaller` (parameterless constructor).
5. **Management API & Auth**:
   - xStatic v17+ controllers live under `/api/v1/xstatic/*` with `[MapToApi("xstatic-v1")]`, `[ApiVersion("1.0")]`, and OpenIddict Bearer auth (`[AuthorizeNormalUser]` / `[AuthorizeAdmin]`). Do not use legacy `UmbracoAuthorizedApiController`.

---

## 1. Custom `IGenerator`

Namespace: `XStatic.Core.Generator`

Prefer subclassing `GeneratorBase` so you inherit media, crop, folder, file copying, transformer execution (`RunTransformers`), and storage helpers (`Store`, `Copy`, `Save`).

Key method to implement:
```csharp
public override async Task<GenerateItemResult> GeneratePage(
    int id,
    int staticSiteId,
    IFileNameGenerator fileNamer,
    IEnumerable<ITransformer> transformers = null,
    string culture = null)
```

Checklist:
- Inject all 8 `GeneratorBase` dependencies: `IUmbracoContextFactory`, `IPublishedUrlProvider`, `IStaticSiteStorer`, `IImageCropNameGenerator`, `MediaFileManager`, `IWebHostEnvironment`, `IOptions<XStaticGlobalSettings>`, `ILogger<YourGenerator>`.
- Register your generator in DI via an `IComposer`:
  ```csharp
  builder.Services.AddSingleton<MyCustomGenerator>();
  ```
- Select your generator in an **Export Type** in the xStatic backoffice (or `XStaticConfigController`).

---

## 2. Custom `ITransformer` & `ITransformerListFactory`

Namespace: `XStatic.Core.Generator.Transformers`

A transformer rewrites generated page content (HTML, JSON, etc.) before it is saved:
```csharp
public interface ITransformer
{
    string Transform(string input, IUmbracoContext context);
}
```

Transformers are attached to an Export Type via an `ITransformerListFactory`:
```csharp
public interface ITransformerListFactory
{
    IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig);
}
```

Checklist:
- To keep xStatic's built-in HTML transformers (`CachedByTransformer`, `CroppedImageUrlTransformer`, `HostnameTransformer`), subclass `DefaultHtmlTransformerListFactory`, iterate `base.BuildTransformers(siteConfig)`, and `yield return` your custom `ITransformer`.
- If your `ITransformerListFactory` has constructor dependencies, register it in an `IComposer`:
  ```csharp
  builder.Services.AddTransient<MyHtmlTransformerListFactory>();
  ```

---

## 3. Custom `IPostGenerationAction`

Namespace: `XStatic.Core.Actions` (base class in `XStatic.Core.Actions.FileActions.PostGenerationActionBase`)

Post-generation actions run after all pages, media, and assets are generated and before deployment.

```csharp
public interface IPostGenerationAction
{
    string Name { get; }
    Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters);
}
```

Checklist:
- Subclass `PostGenerationActionBase` (gives you `GetParameter(parameters, key)`).
- Decorate the class with one or more `[XStaticEditableField("FieldName", UIEditors.Text)]` attributes (use `UIEditors.Password` for secrets).
- Inject `IStaticSiteStorer` (and optionally `ISitesRepository`) to read/write files inside the generated site folder (`_storer.GetStorageLocationOfSite(staticSiteId)` or `_storer.StoreSiteItem(...)`).
- Return `XStaticResult.Success()` or `XStaticResult.Error(message, ex)`.
- Register in DI via an `IComposer` if it has constructor parameters:
  ```csharp
  builder.Services.AddTransient<MyPostGenerationAction>();
  ```

---

## 4. Custom `IDeployer`

Namespace: `XStatic.Core.Deploy`

A deployer consists of three small classes:
1. **`IDeployer`**: Performs deployment from the local generated `folderPath`:
   ```csharp
   public interface IDeployer
   {
       Task<XStaticResult> DeployWholeSite(string folderPath);
   }
   ```
2. **`IDeployerDefinition`**: Declares `Id`, `Name`, `Help`, and `IEnumerable<DeployerField>` (using `UIEditors.*` for `EditorUiAlias`).
3. **`IDeployerAutoInstaller`**: Enables zero-config auto-discovery by `DeployServiceBuilder.AddDeployersAutomatically()`:
   ```csharp
   public interface IDeployerAutoInstaller
   {
       IDeployerDefinition Definition { get; }
       Func<Dictionary<string, string>, IDeployer> Constructor { get; }
   }
   ```

Checklist:
- Keep `IDeployerDefinition.Id` stable (it is persisted in the database on `DeploymentTargetDataModel.DeployerDefinition`).
- Always use `UIEditors.Password` for credentials/tokens so the backoffice masks them and `xstatic-mcp` redacts them.
- Return `XStaticResult.Success("...")` or `XStaticResult.Error("...", ex)` instead of throwing unhandled exceptions.

---

## Reference Examples

For complete, copy-pasteable C# v17+ templates for all four plugin types and `IComposer` registration, read [references/extension-examples.md](references/extension-examples.md).
