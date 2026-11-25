## Target

- **Branch:** <!-- master (Umbraco 18) unless the change only exists on lts/17 or feature/19 -->
- **Also applies to:** <!-- e.g. "lts/17 (cherry-pick down)", or "none". feature/19 gets master through a merge. -->

## Summary

<!-- What changes and why. Link the issue, e.g. "Fixes #123". -->

## Checks

<!-- Tick what you ran. Say why anything you couldn't run was skipped. -->

- [ ] `dotnet build Source/XStaticCore/XStaticCore.sln`: 0 errors, no new warnings in the files I touched
- [ ] `dotnet test Source/XStaticCore/XStatic.Core.Tests/XStatic.Core.Tests.csproj` passes, with tests added or updated for changed logic
- [ ] Integration tests (`./Source/XStaticCore/run-tests.ps1`), if I touched `XStatic/Db/` or V13 upgrade code
- [ ] `npm run check` in the client's `assets` folder, if I touched the backoffice UI
- [ ] Playwright E2E (`Testing/Playwright`), if I changed UI behaviour and had a local Umbraco instance
- [ ] The wiki pages that describe this change are updated and `node Tools/Wiki/wiki.mjs check` passes
- [ ] No public API in `XStatic.Core` changed or removed in a minor release, and no new dependency without a reason given above
