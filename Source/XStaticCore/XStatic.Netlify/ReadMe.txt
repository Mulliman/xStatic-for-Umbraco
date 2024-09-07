
===========================================
xStatic- Netlify
===========================================

Basic setup
-----------

If you are not using auto functionality you can use the following extension method in the ConfigureServices method:

builder.services.AddNetlifyDeployer();

Actions
-------

If you want to use the Netlify actions, e.g. the 404 action, you need to add the following to the ConfigureServices method:

builder.Services.AddNetlifyActions();


Configuring a Netlify deployment step by step
---------------------------------------------

(From https://www.sammullins.co.uk/software/xstatic-for-umbraco/deploying-to-netlify/)

If you don't already have a Netlify account create one and log in.

Create a folder on your local machine, and add an index.html file. The content of this file are not important.

Go to the sites section of Netlify and drag this folder into the section that says "Want to deploy a new site without connecting to Git? Drag and drop your site folder here"

Navigate to the site settings of this site within Netlify, on this page there should be a section called Site Information, which includes a field called API ID. Copy this ID and store somewhere safe.

Open the user applications section of Netlify at the following URL: https://app.netlify.com/user/applications. You can access this page from the user settings section too. In the Personal Access Tokens section create a new access token. Copy the generated key and store for later use. 

Within the xStatic section of Umbraco, open your site configuration in edit mode by selecting from the tree or using the edit button on the dashboard.

In the Deployment Target field, select Netlify and paste the two values acquired above into the correct fields. Press Save.

Return to the xStatic dashboard, and press the deploy button. If the deploy button isn't showing, make sure you have built the site before.

You can now navigate to the static version of you Umbraco site using the URL Netlify has given your application.

Remember, you'll need to fill in the "Asset Paths" field in order for your styles to also be deployed to Netlify.