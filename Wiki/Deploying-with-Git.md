The Git deployer commits your generated site to a Git repository and pushes it to a remote, such as GitHub. A host that builds from Git (GitHub Pages, Netlify, Cloudflare Pages, Azure Static Web Apps and similar) then publishes it. This page is for site builders, with a full GitHub Pages walkthrough.

Read the [limitations](#limitations-and-gotchas) before you commit to this route. The Git deployer is deliberately simple: it clones once, then only commits and pushes.

## At a glance

| | |
|---|---|
| NuGet package | `xStatic.Git` |
| Install | `dotnet add package xStatic.Git --prerelease` (drop `--prerelease` once 18.0.0 is out) |
| Discovered automatically | Yes |
| Deployer in the UI | **Git** (id `git`) |
| Fields | **Remote URL**, **Email**, **Username**, **Password / Personal Access Token**, **Branch** |
| Library used | LibGit2Sharp 0.32.0, so you don't need Git installed on the server |
| Where the local repository lives | Inside the site's output folder, `umbraco/Data/xStatic/output/<site id>` |
| Pulls or merges remote changes | **No** |

## Install

```powershell
dotnet add package xStatic.Git --prerelease
```

Use the same version as your other xStatic packages. The `--prerelease` flag is needed while xStatic 18 is in beta; without it you would get a 17.x package (see [Installation](Installation.md)). Restart the site and **Git** appears in the **Deployer \*** dropdown. Nothing goes in `Program.cs`. If you register xStatic manually, call `AddGitDeployer()` on the deploy builder (`using XStatic.Git;`); see [Extending xStatic](Extending-xStatic.md).

## Walkthrough: GitHub Pages

This takes about fifteen minutes. The same steps work for any remote that accepts a username and token over HTTPS; only the token and branch settings differ.

1. **Create an empty repository on GitHub.** For a site at `https://<your-name>.github.io/` the repository must be called `<your-name>.github.io`. For any other repository the site is served from `https://<your-name>.github.io/<repository>/`, which xStatic doesn't handle without extra work (see [Hosting under a sub-path](#hosting-under-a-sub-path)). Using your own domain avoids the problem.
2. **Set up Pages and your custom domain now, before the first deploy.** In the repository's **Settings** then **Pages**, choose the branch and the `/ (root)` folder to publish from. If you use a custom domain, enter it here. GitHub saves it as a file called `CNAME` in the branch. Do this first, because xStatic never pulls: if GitHub changes the branch after xStatic has cloned it, the next deploy fails (see [Limitations](#limitations-and-gotchas)). GitHub may want at least one commit before Pages can be configured; add a README through the GitHub website if so.
3. **Create a personal access token.** In GitHub, go to **Settings**, **Developer settings**, **Personal access tokens** and create a fine-grained token that can access only this repository, with **Contents** set to **Read and write**. Copy it. The Git deployer's code carries the same advice for the password field ("You need to use PAT for a GitHub repository, assign `Contents` permission when creating it."), but the backoffice doesn't display field help.
4. **Create the deployment target.** Open **xStatic** then **Deployment Targets**, press **Manually Configure New Deployment Target** and fill in the form:

   | Field | What to put in it |
   |-------|-------------------|
   | **Name \*** | A label, for example `GitHub Pages` |
   | **Deployer \*** | **Git** |
   | **Remote URL** | The HTTPS address of the repository, for example `https://github.com/your-name/your-name.github.io.git` |
   | **Email** | The email for the commits xStatic makes |
   | **Username** | Your GitHub username. It is used to sign in and as the author name on commits |
   | **Password / Personal Access Token** | The token from step 3 (not your account password) |
   | **Branch** | The branch to push to, for example `main` (see [Branch](#branch)) |

   Press **Submit**.
5. **Attach it to your site.** On the **xStatic Sites** dashboard press **Edit**, choose the target in **Deployment Target** and submit. Fill in **Asset Paths** so your CSS, JavaScript and images are part of the output (see [Asset paths](Asset-Paths.md)), and set **Target Hostname** if your custom domain differs from the local address you generate from (see [Sites](Sites.md)).
6. Press **Generate**, then **Deploy**, then confirm. The first deploy clones the repository, so it takes longer than later ones.
7. Look at the repository on GitHub. There is a commit called `xStatic build <date time>` containing your site. GitHub Pages publishes it within a minute or two.

### Branch

- **Use the repository's default branch** (usually `main`). That always works.
- **A new branch name** such as `gh-pages` also works. xStatic creates it from the default branch (so it starts with whatever is on the default branch) and pushes it without touching the default branch.
- **An existing branch that isn't the default usually fails.** xStatic's clone checks out only the default branch, then it creates its own local branch with the name you gave, based on the default branch, and pushes it. If the branch already exists on the remote with commits that the default branch doesn't have, Git refuses the push (`cannot push non-fastforwardable reference`). Pick the default branch, a new branch name, or make the branch you want the default.

## What happens during a deploy

[GitDeployer.cs](../Source/XStaticCore/XStatic.Git/GitDeployer.cs):

```mermaid
flowchart TD
    A[Deploy] --> B{Is the output folder<br/>already a Git repository?}
    B -- "No, first deploy" --> C[Move the generated site to ID_temp]
    C --> D[Clone Remote URL into the output folder]
    D -->|clone fails| E[Put the site back and report the error]
    D -->|clone works| F[Copy the generated site over the clone,<br/>delete ID_temp]
    B -- Yes --> G
    F --> G{Repository has<br/>any branches?}
    G -- No, empty remote --> H[Create an initial commit<br/>xStatic init]
    G -- Yes --> I
    H --> I[Create the branch if missing and check it out]
    I --> J[Stage everything<br/>additions, changes and deletions]
    J --> K{Anything changed?}
    K -- Yes --> L["Commit xStatic build yyyy-MM-dd HH:mm"]
    K -- No --> M
    L --> M[Push the branch to origin]
```

In words:

1. The **output folder is the repository**. There is no separate local clone. On the first deploy xStatic moves the generated site to `<output folder>_temp`, clones your remote into the output folder, copies the generated files over the clone, then deletes the temporary folder. If the clone fails (wrong URL, credentials, network), your generated site is put back and the error is reported. This was fixed in 17.3.0 and 18.0.0; in earlier releases, including the betas, a failed clone left the site stranded in the `_temp` folder.
2. If the remote is empty, there are no branches yet, so xStatic makes a commit called `xStatic init` first.
3. The branch you named is created if needed and checked out.
4. Everything is staged, so new, changed and deleted files are all included. A commit called `xStatic build 2026-11-21 14:30` is made only if something changed.
5. The branch is pushed to `origin`, signed in with **Username** and the token. It pushes even when there was nothing new to commit.
6. Success is `Git branch committed and pushed to remote.`. Any exception becomes `Error deploying site using Git.` with the exception attached.

The commit author and committer are **Username** and **Email**. xStatic doesn't use your global Git configuration.

## Files that must survive "Clean"

The **Clean** button on a site empties the output folder, which here is also your working copy. xStatic keeps a short list of files and folders when it cleans. By default that is **`.git`** and **`CNAME`**, so the repository isn't wiped (which would force a fresh clone) and your custom domain file survives.

If you want other files to be kept, list them under `XStatic:DoNotDeletePaths` in `appsettings.json`:

```json
{
  "XStatic": {
    "DoNotDeletePaths": [ ".git", "CNAME", ".nojekyll", "README.md" ]
  }
}
```

- **Setting this list replaces the defaults.** Always include `.git`, and `CNAME` if you use a custom domain.
- A top-level file or folder is kept when its path ends with one of the values.
- Anything not on the list is deleted by **Clean** and, because the next deploy stages deletions, removed from the repository on the next deploy.
- GitHub Pages runs Jekyll over your files, and Jekyll skips files and folders whose names start with an underscore, unless the branch contains an empty `.nojekyll` file. xStatic doesn't create that file. Add it to the repository yourself before the first deploy, and keep it in `DoNotDeletePaths`.

The same setting is described in [Configuration](Configuration.md), along with the code equivalent `DoNotDeletePathsWhenClearing(...)`.

**Deleted pages stay in your repository until you Clean.** Generating adds and overwrites files but never removes them, so a page you delete in Umbraco stays in the output folder and on the remote. To remove it, press **Clean**, **Generate** and **Deploy**.

## Limitations and gotchas

- **No pull or merge.** After the first clone, xStatic only commits and pushes. If anyone changes the remote branch, including GitHub when you add a custom domain or edit a file in the web interface, the next deploy fails as a non-fast-forward push. To recover, either fix the repository by hand (it is in the output folder; use `git pull` there), or delete the `.git` folder inside the output folder so the next deploy clones again.
- **Changing the Remote URL later doesn't move the repository.** The clone keeps its original `origin`. To change remote, delete the `.git` folder in the output folder (or create a new site) and deploy again.
- **Hosting under a sub-path** is not handled for you. See [below](#hosting-under-a-sub-path).
- **A token typed into the field is stored in plain text** in the xStatic database and is visible to the `xStaticAdmin` group through the backoffice API. Type `${env:XSTATIC_GIT_TOKEN}` instead and keep the token in an environment variable ([Secrets and environment variables](Secrets-and-Environment-Variables.md)). If you put the token in the **Remote URL** (`https://user:token@host/...`), use a reference there too; xStatic replaces the credentials with `***` in Git error messages. Use a fine-grained token restricted to one repository, and rotate it if it leaks. See [User groups and security](User-Groups-and-Security.md).
- **Disk space.** The output folder holds both your files and the full repository history, so it is larger than for other deployers.
- **First deploy moves your generated site.** While it runs, the files are briefly in `<output folder>_temp`. Don't press **Generate** or **Clean** during a first deploy.
- **A deploy that fails can still look fine in the dashboard.** "Last deployed" is updated either way and the Sites dashboard doesn't display the deployer's message. Check the Umbraco log for `Error deploying site using Git.`
- **Only HTTPS with a username and token** is supported. SSH remotes and keys are not.

### Hosting under a sub-path

xStatic was built on the assumption that the site is served from the root of a domain. A GitHub Pages project site (`https://you.github.io/my-repo/`) isn't. Links such as `/about/` and `/css/site.css` point at the root of `github.io` and break.

The options are to use a custom domain or a `<your-name>.github.io` repository (both at the root), or to write a transformer that prefixes local URLs with `/my-repo`. See [Writing a transformer](Writing-a-Transformer.md).

## Troubleshooting

| Symptom | Likely cause and fix |
|---------|----------------------|
| `Error deploying site using Git.` with an authentication or 403 error | The token is wrong, expired, or lacks **Contents** read and write, or the **Username** is wrong. Create a new token and edit the target. |
| `cannot push non-fastforwardable reference` | The remote has commits xStatic doesn't have (someone edited it), or **Branch** names an existing branch that isn't the default. See [Branch](#branch) and the first limitation above. |
| Clone errors on the first deploy (repository not found, authentication failed) | The **Remote URL** is mistyped, the token can't see the repository, or the server can't reach the remote. Your generated site is kept. |
| Every deploy takes as long as the first | `.git` is being deleted. If you set `DoNotDeletePaths`, include `.git`. |
| A page I deleted is still on the site | Press **Clean**, then **Generate** and **Deploy**. |
| The custom domain disappears after a deploy | `CNAME` isn't in `DoNotDeletePaths`, so **Clean** removed it and the next deploy deleted it from the repo. Add it back (and to the list). |
| Pages are there but the styles are not | Add the CSS and JavaScript folders to **Asset Paths** on the site. |
| Links 404 on GitHub Pages | The site is under a sub-path. See [Hosting under a sub-path](#hosting-under-a-sub-path). |
| Files and folders starting with `_` are missing on GitHub Pages | Jekyll is ignoring them. Add a `.nojekyll` file to the repository. |

More fixes are on [Troubleshooting](Troubleshooting.md).

## See also

- [Deployment targets](Deployment-Targets.md)
- [Generating and deploying](Generating-and-Deploying.md)
- [Configuration](Configuration.md) for `DoNotDeletePaths`.
- [Writing a transformer](Writing-a-Transformer.md) for sub-path hosting.
- Video: [xStatic 14 - Get Started](https://www.youtube.com/watch?v=_BW8oV3LI1Q) for the target and site screens.
