
===========================================
xStatic- Git
===========================================

Basic setup
-----------

You must add following extension method in the ConfigureServices method of your program class:

using XStatic.Core.App;
using XStatic.Git;

builder.Services.AddXStatic()
    .Automatic()
    .Build();



Current limitations
-------------------

(The following is taken from https://www.sammullins.co.uk/software/xstatic-for-umbraco/deploying-using-git/)

xStatic was built on the assumption that the static site would be hosted at the root of the domain, whereas by default GitHub Pages sites are not. If not using a custom domain/subdomain you may need to write your own transformer to prepend local URLs with your repo name. You could also look at running Umbraco in a local virtual directory of the same name.

If you make changes to the remote Git repository after configuring and running an xStatic Git deploy these changes will not be auto pulled and merged. In order to push future changes you'll need to manually perform this process in the repo created in the App_Data folder.

If you change the remote URL in the xStatic edit interface after running a deploy, this will not change the remote in the repo. If you need to change the remote, create a new site config.

The git repo is never deleted when you clean the temp build files. Using Git will use more diskspace than the Netlify alternative.

You need to be running in 64 bit mode for the Git functionality to work. If you are using IIS Express, navigate to "Visual Studio – Tools – Options – Projects and Solutions – Web Projects" and 

Select "Use the 64 bit version of IIS Express for web sites and projects"


Configuring a Git deployment step by step
-----------------------------------------

(The following is taken from https://www.sammullins.co.uk/software/xstatic-for-umbraco/deploying-using-git/)

Create a repository on your remote. The example here is using GitHub.

If you are using Github pages you'll need to add a single file to the master/main branch in order to set up GitHub Pages in the settings section of your repository.

Configure your custom hostname immediately after creating the repo. xStatic does not pull and merge any changes as part of the deployment process, so any changes made once xStatic has started deployments will need to be pulled and merged manually.

Create a personal access token in GitHub to use for authentication.

If you want any additional files, for example a gitignore file or a readme document in the repo, you will need to add this to the web.config of your project so that the clean up task doesn't delete them. Comma separate folder/file names in the app setting xStatic.DoNotDeletePaths. E.g. <add key="xStatic.DoNotDeletePaths" value=".git,CNAME,Readme.md" />

Within the xStatic section of Umbraco, open your site configuration in edit mode by selecting from the tree or using the edit button on the dashboard.

In the Deployment Target field, select Git and fill in the fields with the details of your remote repo. Press Save.

Return to the xStatic dashboard, and press the deploy button. If the deploy button isn't showing, make sure you have built the site before.

You should now be able to see that changes have been pushed to your remote repository.

Remember, you'll need to fill in the "Asset Paths" field in order for your styles to also be deployed to the Git repo.