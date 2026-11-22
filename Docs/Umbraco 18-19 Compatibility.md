# Umbraco 18 & 19 Compatibility Audit & Upgrade Notes

This document summarizes the compatibility audit of xStatic's auto-publish pipeline, link/asset resolution, and Umbraco core API usage for **Umbraco 17 LTS (17.8.2) → 18 / 19**, including forward-looking extension hooks for shared content and Umbraco 18/19's planned **Library & reusable Elements** architecture.

---

## 1. Auto-Publish & Shared Content / Library Invalidation

### Finding (Before This Update)
Previously, `DefaultAutoPublisher` determined affected static sites exclusively by checking whether each published `IContent.Path` contained `,{siteRootId},` or ended with `,{siteRootId}`.

When shared content nodes (such as a global `/Library` or `/Shared Components` container, or future Umbraco 18/19 reusable Library elements) live outside a site's root content tree, publishing them did **not** match any site's path and silently skipped auto-publish rebuilds.

### Implemented Solution & Extension Hook
`DefaultAutoPublisher` now delegates site resolution to composable `IAutoPublishSiteResolver` implementations registered in DI:

- **`PathBasedAutoPublishSiteResolver`**: Preserves the standard content-tree hierarchy check (`IContent.Path` against each site's `RootNode`). Always active by default.
- **`RelationBasedAutoPublishSiteResolver`** *(opt-in on `lts/17` via `XStatic:EnableRelationBasedAutoPublish = true`)*: Walks upstream Umbraco `umbDocument` reference relations via `IRelationService.GetByChildId(...)` in batched BFS levels (with cycle detection, trashed-node filtering, and configurable `AutoPublishMaxRelationDepth`, default `5`) to locate referencing pages within any configured static site. Non-reference relations such as `relateDocumentOnCopy` are ignored so copying a page never triggers an unrelated site rebuild.
- **Global Shared Content Types**: Sites can also configure `XStatic:AutoPublishGlobalContentTypes` (or `.AutoPublishGlobalContentTypes(...)` on `XStaticServiceBuilder`) for global elements (such as site-wide headers/footers) whose publication should always rebuild all auto-publish sites when relation-based auto-publish is enabled.
- **Custom Resolvers (Forward-Looking for Umbraco 18/19)**: If Umbraco 18/19 introduces a dedicated Library/Element storage model or reference service outside `IRelationService`, projects or future xStatic major versions can plug in a custom resolver without modifying core:

```csharp
builder.Services.AddXStatic()
    .Automatic()
    .EnableRelationBasedAutoPublish(true)
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
| **`StaticHtmlSiteGenerator`** | `XStatic.Core/Generator/StaticHtmlSiteGenerator.cs` | Uses `IPublishedUrlProvider` (`UrlMode.Relative` / `UrlMode.Absolute`) and skips nodes where `node.TemplateId == null`. This safely skips non-routable shared/Library nodes during full-site HTML generation while `RelationBasedAutoPublishSiteResolver` ensures referencing pages are rebuilt. |
| **`AssetPathResolver`** | `XStatic.Core/Generator/Processes/AssetPathResolver.cs` | Pure file-system resolution against `IWebHostEnvironment.WebRootPath` and `ContentRootPath`. No deprecated Umbraco APIs; fully compatible with Umbraco 18/19. |
| **`GeneratorBase` (Media)** | `XStatic.Core/Generator/GeneratorBase.cs` | Uses `MediaFileManager` and `IPublishedUrlProvider`. Note: `GetContext()` disposes `UmbracoContextReference` immediately before returning `IUmbracoContext`; in Umbraco 18/19, prefer passing `IUmbracoContext` or `IPublishedContentCache` inside an active `using` scope rather than returning it outside the `using` block. |
| **`UmbracoContentUdiToJsonUrlTransformer`** | `XStatic.Core/Generator/Transformers/UmbracoContentUdiToJsonUrlTransformer.cs` | Currently matches `umb://document/{32hex}` and calls `item.Url()` without an explicit `IPublishedUrlProvider`. For Umbraco 18/19 JSON exports that serialize GUID keys or element references for reusable Library elements, consider adding a companion transformer that resolves `IPublishedUrlProvider` explicitly and handles key-based references. |

---

## 3. Obsolete Umbraco 17 APIs Scheduled for Removal in Umbraco 18

A compiler audit against Umbraco `17.8.2` identified three obsolete APIs marked `Scheduled for removal in Umbraco 18` that need migration when targeting Umbraco 18+ (note: `feature/18` already tracks these replacements):

1. **`IPublishedContent.Parent` (`CS0618`)**
   - `Source/XStaticCore/XStatic.Core/Generator/BasicJsonApiGenerator.cs` (line 75)
   - `Source/XStaticCore/XStatic/Controllers/SitesController.cs` (line 69)
   - **Action for v18:** Replace `content.Parent` with `content.Parent()` (from `Umbraco.Extensions`) or `IDocumentNavigationQueryService`.

2. **`MigrationBase` (`CS0618`)**
   - `Source/XStaticCore/XStatic/Db/XStaticDatabaseMigrationPlan.cs` (line 25)
   - **Action for v18:** Migrate `MigrationBase` subclasses to `AsyncMigrationBase` (`MigrateAsync()`).

3. **`Upgrader.Execute(...)` (`CS0618`)**
   - `Source/XStaticCore/XStatic/Db/XStaticDatabaseNotificationHandler.cs` (line 41)
   - **Action for v18:** Convert `XStaticDatabaseNotificationHandler` to `INotificationAsyncHandler<UmbracoApplicationStartingNotification>` and call `await upgrader.ExecuteAsync(...)`.

### Forward-Looking Note on Umbraco 18/19 Notifications
- `AutoPublishNotificationHandler` currently subscribes to `ContentPublishedNotification`.
- If Umbraco 18/19 introduces a dedicated notification type for Library/Element publication (separate from `ContentPublishedNotification` / `IContent`), register a thin `INotificationAsyncHandler<...>` forwarding to `IAutoPublisher` (or a new overload accepting element keys/IDs).
