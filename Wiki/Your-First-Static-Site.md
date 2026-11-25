A start-to-finish tutorial: from a new Umbraco site with a starter kit to a generated static copy that you deploy to a
folder on your own machine and view in a browser. It takes about fifteen minutes and doesn't need an account with any
hosting provider. If you already have an Umbraco 17 site, skip to [step 2](#2-install-xstatic).

## Before you start

You need the [.NET 10 SDK](https://dotnet.microsoft.com/download) and, to view the result at the end, either Node.js
or Python. The steps use the command line, but you can do the same in Visual Studio or Rider.

## 1. Create an Umbraco site with a starter kit

xStatic renders your real Umbraco pages, so you need a site with templates and some published content. The Clean
starter kit gives you both.

```powershell
dotnet new install Umbraco.Templates::17.8.2
dotnet new umbraco --name MyStaticDemo
cd MyStaticDemo
dotnet add package clean
dotnet run
```

`dotnet run` prints the address the site is listening on, for example `https://localhost:44359`. Open it and follow
the Umbraco installer to create your first user. That user is the **root user**, and it is the one xStatic gives access
to in the next step.

When the installer finishes, Clean adds its sample content and templates. Browse the front end to check the pages
render. If the content tree shows unpublished pages, publish them, because xStatic only generates published content.
Then stop the site.

## 2. Install xStatic

```powershell
dotnet add package xStatic
dotnet run
```

There is no code to add. Sign in to the backoffice as the root user and open the **xStatic** section. If the section
is missing, see [Installation](Installation.md#find-xstatic-in-the-backoffice).

The section has several tabs. You will use three of them here:
**Deployment Targets**, **Export Types** and **xStatic Sites**. The [Backoffice tour](Backoffice-Tour.md) covers the rest.

## 3. Create a deployment target

A deployment target says where finished files should go. Here that is a folder on your disk.

1. Open the **Deployment Targets** tab.
2. Click **Manually Configure New Deployment Target**.
3. Set **Name \*** to `Local folder`.
4. Set **Deployer \*** to **File System**. The **Configuration** panel under it fills with the deployer's fields.
5. Set **Folder Path** to an empty folder, such as `C:\Temp\my-static-site` on Windows or `/tmp/my-static-site` on
   Mac and Linux. xStatic creates the folder if it doesn't exist.
6. Click **Submit**.

A card named **Local folder** appears. The **Deployment Targets** tab is only visible to users in the `xStaticAdmin`
group, because targets can hold passwords. See [Deployment targets](Deployment-Targets.md).

## 4. Check the export type

An export type chooses how pages are turned into files. xStatic adds one called **HTML Website** when it first starts,
and that is what you want for a normal static site. Open the **Export Types** tab to see it. You don't need to change
anything. [Export types](Export-Types.md) explains the options.

## 5. Create the site

1. Open the **xStatic Sites** tab.
2. Click **Create new static site**.
3. Fill in the dialog:

   | Field | What to enter |
   |-------|---------------|
   | **Site Name \*** | `My static demo` |
   | **Root Node \*** | Click **Choose** and pick the top **Home** node of your content tree |
   | **Media Root Nodes** | Click **Choose** and pick the media folders your pages use, or the whole media library for this demo |
   | **Export Format \*** | **HTML Website** |
   | **Deployment Target** | **Local folder** |

   Leave the other fields as they are. **Cultures**, **Asset Paths**, **Image Crops**,
   **Post Generation Actions**, **Auto Publish** and **Target Hostname** are all optional. The [Sites](Sites.md) page
   describes each one.
4. Click **Submit**.

A card for **My static demo** appears with the root node's path, **Exports as HTML Website**, **Manual Deploy**,
and the notes **This site has never been built.** and **This site has never been deployed.**

## 6. Generate the site

1. On the card, click **Generate**.
2. A progress bar replaces the card while xStatic works. xStatic fetches every published page from the running site,
   copies the media you chose, and stores the result.
3. When it finishes, the card shows **Last generated on** with the date and time and a **Size** line, and the
   **Clean** and **Download** buttons appear.

If some items failed, a warning notification says **Site generated with N problem(s)** and lists up to five of them.
The pages that worked are still stored. See [Generating and deploying](Generating-and-Deploying.md) for how to read
the results.

The generated files are kept in your Umbraco project at `umbraco/Data/xStatic/output/{site id}`. The first site you
create is usually site `1`. Open it and you will see one `index.html` per page, each in a folder named after the page's
URL, plus a `media` folder:

```text
umbraco/Data/xStatic/output/1/
  index.html
  about/index.html
  blog/index.html
  media/...
```

You can click **Download** at any point to get everything as a zip file instead.

## 7. Deploy to the folder

1. On the card, click **Deploy**.
2. Confirm in the **Deploy Site** dialog by clicking **Deploy**.
3. When it finishes, the card shows **Last deployed on** with the date and time.

The File System deployer copies the generated files into the **Folder Path** you set, overwriting files that already
exist. It does not delete anything that is already in that folder. [Deploying to a folder](Deploying-to-a-Folder.md)
has the details.

## 8. View the static site

Your deployed folder is a complete website. Serve it with any static file server:

```powershell
cd C:\Temp\my-static-site
npx serve
```

or, with Python:

```bash
cd /tmp/my-static-site
python -m http.server 8080
```

Open the address it prints. You are now looking at a copy of your Umbraco site that needs no Umbraco, no database and
no .NET to run. Stop the Umbraco site and refresh to prove it.

Static servers can't run your Umbraco forms or search, so anything that relies on server code won't work in the copy.
[What is xStatic?](What-is-xStatic.md) covers what to expect.

## Troubleshooting the first run

- **The xStatic section isn't there.** The user isn't in a group with access. See
  [Installation](Installation.md#find-xstatic-in-the-backoffice).
- **There is no Deploy button.** The site has no **Deployment Target**. Edit the site and choose one.
- **Pages fail with a download error.** The site must be running and reachable at the address Umbraco generates for
  each page. On Mac or Linux with a self-signed certificate, set `XStatic:TrustSslWhenGenerating` to `true`. See
  [Troubleshooting](Troubleshooting.md).
- **The static copy has no styling or scripts.** CSS, JavaScript and fonts that live on disk rather than in the media library are only copied if you list them under **Asset Paths**. View the page source to find their paths, then see [Asset paths](Asset-Paths.md).
- **Links in the static copy point at `localhost`.** Set **Target Hostname** on the site to the hostname you will
  publish on, such as `www.example.com`, then generate again. This only replaces hostnames that are set in Umbraco's
  **Culture and Hostnames**, so add your local address there first. See [Sites](Sites.md#target-hostname).

## Next steps

- Put the site on the internet with [Netlify](Deploying-to-Netlify.md), [Git](Deploying-with-Git.md) or
  [FTP](Deploying-to-FTP.md).
- Rebuild automatically when editors publish: [Auto publish](Auto-Publish.md).
- Include CSS and scripts that live outside Umbraco's media library: [Asset paths](Asset-Paths.md).
- Make resized images: [Image crops](Image-Crops.md).
- Watch the [xStatic 14 - Get Started video](https://www.youtube.com/watch?v=_BW8oV3LI1Q) for the same flow on screen.
