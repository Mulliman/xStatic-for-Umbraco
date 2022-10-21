
===========================================
xStatic- Netlify
===========================================

Basic setup
-----------

Just installing this package should be enough to get started.

If you are not using auto functionality you can use the following extension method in the ConfigureServices method:

services.AddNetlifyDeployer();

Actions
-------

If you want to use the Netlify actions, e.g. the 404 action, you need to add the following to the ConfigureServices method:

services.AddNetlifyActions();