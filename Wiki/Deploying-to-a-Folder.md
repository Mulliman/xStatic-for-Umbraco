The File System deployer copies your generated site into a folder on the machine that runs Umbraco (or any folder that machine can write to). It is the simplest deployer, it needs no extra package, and it is the one used in [Your first static site](Your-First-Static-Site.md). Use it when something else on the server (IIS, nginx, a shared drive, a Docker volume, a sync tool) serves or picks up the files.

## At a glance

| | |
|---|---|
| Package | None. It is built into `xStatic.Core`, which the `xStatic` package installs |
| Deployer name in the UI | **File System** (id `filesystem`) |
| Discovered automatically | Yes |
| Field | **Folder Path** (alias `File.FolderPath`) |
| Deletes files in the destination | **No**. It only copies and overwrites |
| Help text in the deployer's code | "Deploys the contents of the site to a folder path" (the backoffice doesn't show it) |

## Set it up

1. Open the **xStatic** section in the backoffice and go to the **Deployment Targets** dashboard.
2. Press **Manually Configure New Deployment Target**.
3. Fill in the form:
   - **Name \***: anything that helps you tell targets apart, for example `Live web folder`.
   - **Deployer \***: choose **File System**.
   - **Configuration**: type the full path of the destination in **Folder Path**, for example `D:\Websites\my-static-site` on Windows or `/var/www/my-static-site` on Linux.
4. Press **Submit**.
5. Go to the **xStatic Sites** dashboard, press **Edit** on your site and choose the target in **Deployment Target**. Press **Submit**. The **Deploy** button appears on the site once it has a deployment target.
6. Press **Generate** (the files are only deployed after they have been generated), then **Deploy**, then confirm.

Check the destination folder. Your `index.html`, the other pages and any [asset paths](Asset-Paths.md) you listed are there.

> Use an absolute path. The deployer passes your text straight to .NET, so a relative path is resolved against the
> process's working directory, which is hard to predict under IIS or in a container.

## What happens during a deploy

[FileSystemDeployer.cs](../Source/XStaticCore/XStatic.Core/Deploy/FileSystemDeployer.cs) does one thing:

```mermaid
flowchart LR
    A[Site output folder<br/>umbraco/Data/xStatic/output/ID] -->|copy every file and folder,<br/>overwrite existing files| B[Folder Path]
```

1. If **Folder Path** does not exist, it is created, along with any missing parent folders.
2. Every file in the site's output folder is copied across, one folder at a time, and files that already exist in the destination are overwritten.
3. If anything throws (for example, access denied), the result is `Error deploying site to file system.` with the exception attached. Otherwise it is `Folder on file system updated.`

Where the output folder is, and what the Generate and Deploy buttons do around this step, is described in [Generating and deploying](Generating-and-Deploying.md).

## Limitations and gotchas

- **Nothing is ever deleted from the destination.** If you delete a page in Umbraco, or rename one, the old file stays in **Folder Path** until you remove it. The same is true of the generated output, which is only emptied by the **Clean** button (it keeps `.git` and `CNAME` by default; see [Generating and deploying](Generating-and-Deploying.md)). If you need an exact mirror, use the [FTP deployer](Deploying-to-FTP.md) (which deletes) or empty the destination yourself before deploying.
- **The Umbraco process needs write access.** The destination must be writable by the account your site runs as (the app pool identity on IIS, the container user in Docker). A network share works when that account can write to it.
- **Every file is copied on every deploy.** There is no comparison of changed files. This is fine for most sites, but slow for very large ones.
- **A deploy is not atomic.** Visitors can see a half-copied site while it runs. If that matters, deploy to a staging folder and swap folders afterwards.
- **Files starting with a dot are copied too**, for example `.xstatic-metadata` if you use the metadata action (see [Post-generation actions](Post-Generation-Actions.md)).
- **Failed deploys still update "Last deployed".** The Sites dashboard also doesn't display the message a deployer returns, so if a deploy seems to have done nothing, check the Umbraco log for `Error deploying site to file system.` See [Troubleshooting](Troubleshooting.md).

## Troubleshooting

| Symptom | Likely cause and fix |
|---------|----------------------|
| `Failed to deploy. No generated output found at '...'. Generate the site before deploying.` | The site has not been generated, or you pressed **Clean**. Press **Generate** first. |
| `Failed to deploy. Deployment target null` | The site has no **Deployment Target**. Edit the site and choose one. |
| `Error deploying site to file system.` in the log | Read the attached exception. Usually access denied (permissions) or a path that is not valid on this machine, such as a Windows path on a Linux server. |
| Old pages are still in the destination | Expected. The File System deployer never deletes. Remove them by hand. |
| Pages are there but styles and scripts are missing | The CSS and JavaScript are not in your generated site. Add them under **Asset Paths** on the site (see [Asset paths](Asset-Paths.md)) and generate again. |
| The target is missing from the site's dropdown | Refresh the backoffice and open the site dialog again. |

## See also

- [Deployment targets](Deployment-Targets.md): creating, editing and deleting targets.
- [Generating and deploying](Generating-and-Deploying.md): the Generate, Deploy, Clean and Download buttons.
- [Auto publish](Auto-Publish.md): regenerate and deploy whenever content is published.
- [Static failover site](Static-Failover-Site.md): a recipe that serves a deployed folder when Umbraco is down.
- Videos: [xStatic 14 - Get Started](https://www.youtube.com/watch?v=_BW8oV3LI1Q) walks through the dashboards used here.
- [Writing a deployer](Writing-a-Deployer.md) if you need a destination xStatic doesn't cover.
