# Security policy

xStatic runs inside the Umbraco backoffice and holds the credentials it uses to deploy your site, so security reports
are taken seriously. Thank you for helping keep xStatic, and the sites built with it, safe.

## Supported versions

| xStatic | Umbraco | Branch | Security fixes |
|---------|---------|--------|:--------------:|
| 19.x | 19 | `feature/19` | ✅ (pre-release until 19.0.0 ships) |
| 18.x | 18 | `master` | ✅ |
| 17.x | 17 (LTS) | `lts/17` | ✅ |
| 13.x and older | 13 and older | | ❌ |

Fixes ship as a new patch release of each supported major. To get them, upgrade to the latest patch of the major you use.

## Reporting a vulnerability

**Please don't report security problems in public issues, discussions or pull requests.**

Report them privately through GitHub instead:

1. Open [Report a vulnerability](https://github.com/Mulliman/xStatic-for-Umbraco/security/advisories/new)
   (or go to the repository's **Security** tab and choose **Report a vulnerability**).
2. Tell us:
   - which package and version is affected, and which Umbraco version you're on
   - how to reproduce it (steps, a proof of concept, or a sample request)
   - what an attacker could do with it
   - a suggested fix, if you have one

Only the maintainer can see the report.

## What happens next

xStatic is maintained by one volunteer, so these are targets rather than guarantees:

- **Within 7 days:** you get an acknowledgement.
- **Within 14 days:** the problem is confirmed or ruled out, and you're kept up to date from then on.
- **Within 30 days of confirmation:** a fixed release for every supported version, sooner for anything critical. The
  disclosure date is agreed with you.
- **When the fix ships:** a [GitHub security advisory](https://github.com/Mulliman/xStatic-for-Umbraco/security/advisories)
  is published, with a CVE where it's warranted. You're credited unless you'd rather not be.

## Scope

**In scope:** everything in this repository. That means the NuGet packages (`xStatic`, `XStatic.Core`,
`XStatic.Client`, `XStatic.Netlify`, `XStatic.Git`, `XStatic.Ftp`, `XStatic.Cloudflare`, `XStatic.RemoteOperations`,
`XStatic.AI`), the `xstatic-mcp` server, and the GitHub Actions workflows that build and release them. For example:

- getting round xStatic's user-group permissions
- deployment credentials reaching users or output that shouldn't see them, such as editors, logs or the generated site
- path traversal when generating, storing or deploying files
- injection (SQL, XSS, command) in the backoffice UI or the Management API endpoints

**Report these elsewhere:**

- **Umbraco CMS itself:** follow Umbraco HQ's
  [how to report a vulnerability](https://umbraco.com/trust-center/security-and-umbraco/how-to-report-a-vulnerability-in-umbraco/).
- **A hosting or deployment provider** (Netlify, Cloudflare, GitHub, your FTP server): report it to that provider.

**Known and documented, so not a vulnerability on its own:**

- Deployer secrets are stored in plain text in the Umbraco database, and only `xStaticAdmin` users can read them
  through the API. See [Deployment targets](Wiki/Deployment-Targets.md#secrets-where-they-live-and-who-sees-them).
  This applies to values typed into the field. The recommended mitigation is to type a `${env:...}` or `${config:...}`
  reference instead, so only the reference is stored (xStatic 18.1.0 and 17.4.0 onwards). See
  [Secrets and environment variables](Wiki/Secrets-and-Environment-Variables.md). Ideas for further hardening are
  welcome as a normal issue.
- Export types can be edited by normal users. This is intentional because they hold no secrets.

## Keeping your site secure

[User groups and security](Wiki/User-Groups-and-Security.md) in the wiki has the full guidance. In short:

- **Stay on the latest patch** of a supported version.
- **Turn on the xStatic user groups** and keep `xStaticAdmin` to the people who set up hosting.
- **Give deployers least-privilege tokens** that you can revoke, and protect database backups, because they contain
  any tokens typed in as plain text. Better still, keep tokens out of the database with `${env:...}` or `${config:...}`
  [secret references](Wiki/Secrets-and-Environment-Variables.md).
- **Consider keeping the backoffice off the public internet.** With xStatic, visitors only ever reach the static
  host. The Umbraco site that builds it can sit behind a VPN, an IP allow-list or a private network.

## How releases are built

- Packages are built, tested and pushed to nuget.org by GitHub Actions, using
  [NuGet Trusted Publishing](https://learn.microsoft.com/nuget/nuget-org/trusted-publishing), so no long-lived NuGet
  API key exists.
- [Dependabot](https://github.com/Mulliman/xStatic-for-Umbraco/blob/master/.github/dependabot.yml) proposes dependency updates for each supported branch. Minor and patch
  updates, including security fixes, merge automatically once the required checks pass. Workflow actions are pinned
  to commit SHAs.
- [CodeQL](.github/workflows/codeql.yml) scans the C#, TypeScript and workflow code on every pull request and push.
- The [OpenSSF Scorecard](https://scorecard.dev/viewer/?uri=github.com/Mulliman/xStatic-for-Umbraco) checks the
  repository's security practices every week.
