===========================================
xStatic - Netlify
===========================================

Deploys your xStatic site to Netlify. It also adds the Netlify site creator, which makes the
Netlify site and the deployment target for you from the backoffice.

With the default setup there is nothing to register: the deployer is found automatically.
To use the Netlify 404 action, add this to Program.cs:

    builder.Services.AddNetlifyActions();

Full guide: https://mulliman.github.io/xStatic-for-Umbraco/Deploying-to-Netlify
