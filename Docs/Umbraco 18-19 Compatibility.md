# Umbraco 18 & 19 Compatibility Audit & Upgrade Notes

This document summarizes the compatibility audit of xStatic's auto-publish pipeline, link/asset resolution, and Umbraco core API usage for **Umbraco 17 LTS → 18 / 19**, including support for Umbraco 18/19's **Library & reusable Elements** architecture.

---

## 1. Auto-Publish & Library / Reusable Elements Invalidation

### Finding (Before This Update)
Previously, `DefaultAutoPublisher` determined affected static sites exclusively by checking whether each published `IContent.Path` contained `,{siteRootId},` or ended with `,{siteRootId}`.

Under Umbraco 18/19's **Library & reusable Elements** model (and existing shared-content folders outside a site root), shared elements live in a separate Library/container tree rather than underneath a site's root node. Publishing a shared Library element therefore did **not** match any site's path and silently skipped auto-publish rebuilds.

### Implemented Solution & Extension Hook
`DefaultAutoPublisher` now delegates site resolution to composable `IAutoPublishSiteResolver` implementations registered in DI:

- **`PathBasedAutoPublishSiteResolver`**: Preserves the standard content-tree hierarchy check (`IContent.Path` against each site's `RootNode`).
- **`RelationBasedAutoPublishSiteResolver`**: Walks upstream Umbraco reference relations via `IRelationService.GetByChildId(...)` (with cycle detection and configurable `AutoPublishMaxRelationDepth`, default `5`) to locate referencing pages within any configured static site. When a shared Library item or nested reusable Element is published, every static site containing a referencing page is automatically queued for rebuild and deployment.
- **Global Shared Content Types**: Sites can also configure `XStatic:AutoPublishGlobalContentTypes` (or `.AutoPublishGlobalContentTypes(...)` on `XStaticServiceBuilder`) for global elements (such as site-wide headers/footers) whose publication should always rebuild all auto-publish sites.
- **Custom Resolvers**: Projects or future Umbraco 18/19 packages can plug in custom dependency resolvers (e.g., querying a new Umbraco 18/19 Library/Element reference service) via:

```csharp
builder.Services.AddXStatic()
    .Automatic()
    .AddAutoPublishSiteResolver<MyLibraryAutoPublishSiteResolver>()
    .Build();
```

### Configuration (`appsettings.json`)

```json
{
  "XStatic": {
    "EnableRelationBasedAutoPublish": true,
    "AutoPublishMaxRelationDepth": 5,
    "AutoPublishGlobalContentTypes": [
      "globalNavigation",
      "sharedFooterElement"
    ]
  }
}
```

---

## 2. Link, Media & Asset Resolution Audit

| Component | Location | Umbraco 18/19 Readiness & Notes |
| --- | --- | --- |
| **`StaticHtmlSiteGenerator`** | `XStatic.Core/Generator/StaticHtmlSiteGenerator.cs` | Uses `IPublishedUrlProvider` (`UrlMode.Relative` / `UrlMode.Absolute`) and skips nodes where `node.TemplateId == null`. This safely skips non-routable Library/Element nodes during full-site HTML generation while `RelationBasedAutoPublishSiteResolver` ensures referencing pages are rebuilt. |
| **`AssetPathResolver`** | `XStatic.Core/Generator/Processes/AssetPathResolver.cs` | Pure file-system resolution against `IWebHostEnvironment.WebRootPath` and `ContentRootPath`. No deprecated Umbraco APIs; fully compatible with Umbraco 18/19. |
| **`GeneratorBase` (Media)** | `XStatic.Core/Generator/GeneratorBase.cs` | Uses `MediaFileManager` and `IPublishedUrlProvider`. Note: `GetContext()` disposes `UmbracoContextReference` immediately before returning `IUmbracoContext`; in Umbraco 18/19, prefer passing `IUmbracoContext` or `IPublishedContentCache` inside an active `using` scope rather than returning it outside the `using` block. |
| **`UmbracoContentUdiToJsonUrlTransformer`** | `XStatic.Core/Generator/Transformers/UmbracoContentUdiToJsonUrlTransformer.cs` | Currently matches `umb://document/{32hex}` and calls `item.Url()` without an explicit `IPublishedUrlProvider`. For Umbraco 18/19 JSON exports that serialize GUID keys or `umb://element/` references for reusable Library elements, consider adding a companion transformer that resolves `IPublishedUrlProvider` explicitly and handles key-based references. |

---

## 3. Obsolete Umbraco 17 APIs Scheduled for Removal in Umbraco 18

A compiler audit against Umbraco `17.0.0` identified three obsolete APIs marked `Scheduled for removal in Umbraco 18` that will need to be migrated when targeting Umbraco 18+:

1. **`IPublishedContent.Parent` (`CS0618`)**
   - `Source/XStaticCore/XStatic.Core/Generator/BasicJsonApiGenerator.cs` (line 75)
   - `Source/XStaticCore/XStatic/Controllers/SitesController.cs` (line 67)
   - **Action for v18:** Replace `content.Parent` with `content.Parent<IPublishedContent>()` (from `Umbraco.Extensions`) or `IDocumentNavigationQueryService`.

2. **`MigrationBase` (`CS0618`)**
   - `Source/XStaticCore/XStatic/Db/XStaticDatabaseMigrationPlan.cs` (line 25)
   - **Action for v18:** Migrate `MigrationBase` subclasses to `AsyncMigrationBase` (`MigrateAsync()`).

3. **`Upgrader.Execute(...)` (`CS0618`)**
   - `Source/XStaticCore/XStatic/Db/XStaticDatabaseNotificationHandler.cs` (line 41)
   - **Action for v18:** Convert `XStaticDatabaseNotificationHandler` to `INotificationAsyncHandler<UmbracoApplicationStartingNotification>` and call `await upgrader.ExecuteAsync(...)`.

4. **Notification Coverage for Umbraco 18/19 Library Events**
   - `AutoPublishNotificationHandler` currently subscribes to `ContentPublishedNotification`.
   - **Action for v18/19:** If Umbraco 18/19 introduces a dedicated notification type for Library/Element publication (separate from `ContentPublishedNotification`), register a thin `INotificationAsyncHandler<...>` forwarding to `IAutoPublisher.RunAutoPublish(...)` (or a new overload accepting element keys/IDs).
