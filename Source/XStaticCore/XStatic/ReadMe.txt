
===========================================
xStatic- Static Site Generation for Umbraco
===========================================

Basic setup
-----------

Add the following to the ConfigureServices method in your Startup.cs file

services.AddXStatic().Automatic().Build();

You will need to add using XStatic.Core.App; to the top of the file.

This will automatically register all the built in services as required for an out of the box solution.


Custom setup
-----------

If you want to override the default services used, look through the classes in the XStatic.Core.App namespace.

You can use the methods in the GeneratorServiceBuilder to add the generation services you require.
Deployers can be manually set using the DeployServiceBuilder class.

Both of these can be accessed from the XStatic app you get by using services.AddXStatic() in the startup class.


Plugins
-------

Plugins can be found by search NuGet for xStatic. 
These will likely require more services to be registered in the startup class. See specific plugins for details.