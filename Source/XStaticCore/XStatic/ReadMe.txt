
===========================================
xStatic- Static Site Generation for Umbraco
===========================================

Basic setup
-----------

1. Ensure that Umbraco is installed and working before running the site with xStatic installed. 

2. Add the following to your program.cs file:
You must add following extension method in the ConfigureServices method of your program class:

using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .Build();

This will automatically register all the built in services as required for an out of the box solution.

3. Ensure that the \App_Plugins\xStatic folder and files are included in your csproj. These need to be present in your website for the xStatic section to appear.

4. In the users section, add 'xStatic Generated Sites' to the roles you want to have access.

5. Create your site configs and build / deploy your static sites.


Custom setup
-----------

If you want to override the default services used, look through the classes in the XStatic.Core.App namespace.

You can use the methods in the GeneratorServiceBuilder to add the generation services you require.
Deployers can be manually set using the DeployServiceBuilder class.

Both of these can be accessed from the XStatic app you get by using services.AddXStatic() in the startup class.


Plugins
-------

Plugins can be found by search NuGet for xStatic or looking at the Information & Plugins tab. 
These will likely require more services to be registered in the startup class. See specific plugins for details.