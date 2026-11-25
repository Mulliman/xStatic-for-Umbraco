# Releasing xStatic

Releases are the maintainer's decision. Agents prepare branches, notes and checks, but never create tags or
releases, or push to NuGet.

All 9 packages (`xStatic`, `xStatic.Core`, `xStatic.Client`, `xStatic.Netlify`, `xStatic.Git`, `xStatic.Ftp`,
`xStatic.Cloudflare`, `xStatic.AI`, `xStatic.RemoteOperations`) are released together with one version, taken from the tag.

## Which branch

| Releasing | Release from | Tag |
|-----------|--------------|-----|
| The latest major (currently 18) | `master` | `v18.x.y` |
| An LTS patch or minor (17) | `lts/17` | `v17.x.y` |
| A preview of a new major (19) | `feature/19` | `v19.0.0-beta`, `-rc1`, … |

## Checklist

1. **CI is green** on the branch, including the GitHub Packages preview. Install the preview in a real site if
   the release changes something the tests can't see.
2. **Playwright passes** against a local site on the minimum Umbraco version (see `Testing.md`). Both the
   site and the branch's code must be the version you're releasing.
3. **Deployers you changed are tried for real**: Netlify, Cloudflare and FTP need a real account or server. The Git deployer
   is covered by tests against a local repository.
4. **Docs are current**: `AGENTS.md` (versions table, known issues), `Wiki/` (pages match the release, samples compile, `node Tools/Wiki/wiki.mjs check` passes), `README.md`.
5. **Release notes are written**, including:
   - the minimum Umbraco version
   - anything that behaves differently (new errors, removed dependencies, new settings)
   - upgrade steps

## Release

1. GitHub → **Releases** → **Draft a new release**.
2. **Choose a tag**: type the new tag (for example `v17.3.0`), then pick the **target** branch from the table above.
3. Paste the release notes. Tick **Set as a pre-release** for `-beta` and `-rc` versions.
4. **Publish release.** This creates the tag, which runs `.github/workflows/release.yml`: test and Playwright E2E
   → pack → push to nuget.org via Trusted Publishing.
5. Watch the **Release** workflow run. nuget.org can take up to an hour to index and show the new versions.

To check packaging without publishing, run the Release workflow manually (**Actions** → **Release** →
**Run workflow**) with a version such as `18.3.0-test.1`. Pick the branch you're releasing from: the run uses that
branch's copy of the workflow, and the version's major must match its Umbraco major. The dry run includes the
Playwright E2E job, so it's also how to check E2E on GitHub before tagging (or `gh workflow run release.yml --ref <branch> -f version=<version>`).

## After a new major

- Merge `feature/NN` into `master`.
- If the previous major is an LTS, it already has its own `lts/NN` branch (see `AGENTS.md`); otherwise it stops
  getting fixes.
- Update the versions table in `AGENTS.md` on `master` and every `lts/*` branch.

## Publishing setup

- nuget.org → **Trusted Publishing** policy: repository `Mulliman/xStatic-for-Umbraco`, workflow `release.yml`,
  no environment.
- Repository secret `NUGET_USER`: the nuget.org account name that owns the packages.
- Branch protection on `master` and `lts/17` requires the two `Test / …` jobs from `ci.yml`.
