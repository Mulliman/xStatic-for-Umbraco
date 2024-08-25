
===========================================
xStatic- FTP
===========================================

Basic setup
-----------

You must add following extension method in the ConfigureServices method of your program class:

using XStatic.Core.App;
using XStatic.Ftp;

builder.Services.AddXStatic()
    .Automatic()
    .Build();


Configuring an FTP deployment step by step
------------------------------------------

(This is taken from https://www.sammullins.co.uk/software/xstatic-for-umbraco/deploying-to-ftp-server/)


Within the xStatic section of Umbraco, open your site configuration in edit mode by selecting from the tree or using the edit button on the dashboard.

In the Deployment Target section, select FTP and fill in the fields with the details of your FTP server. For the hostname don't include the scheme, for example you only need to specify 'ftp.mywebsite.com'. If you don't specify a port number, 21 is used. Press Save.

Select this Deployment Target from the dropdown list in the edit dialog of your site and press Save.

Return to the xStatic dashboard, and press the deploy button. If the deploy button isn't showing, make sure you have built the site before.

You should now be able to see that the files on the FTP server match the structure of your Umbraco site.

Remember, you'll need to fill in the "Asset Paths" field in order for your styles to also be deployed to the Git repo.