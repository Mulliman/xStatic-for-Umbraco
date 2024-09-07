
===========================================
xStatic- Static Site Generation for Umbraco
===========================================

Basic setup
-----------

### Option 1 - No Custom configuration

You are ready to go! When you log into Umbraco you should see a new section called 'xStatic' and your root user should have two new user groups assigned.


### Option 2 - Custom configuration with no additional roles

Add the following to your program.cs file:

using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .Build();

This will automatically register all the built in services as required for an out of the box solution.

In the users section, add 'xStatic' to the roles you want to have access.

### Option 3 - Custom configuration with additional roles to allow for tighter security

Add the following to your program.cs file:

using XStatic.Core.App;

builder.Services.AddXStatic()
    .Automatic()
    .UseSecureUserGroups("admin@admin.com")
    .Build();

This will automatically register all the built in services as required for an out of the box solution.
Your specified user should have two new user groups assigned.


Custom setup
-----------

If you want to override the default services used, look through the classes in the XStatic.Core.App namespace.

You can use the methods in the GeneratorServiceBuilder to add the generation services you require.
Deployers can be manually set using the DeployServiceBuilder class.

Both of these can be accessed from the XStatic app you get by using services.AddXStatic() in the startup class.


Plugins
-------

Plugins can be found by search NuGet for xStatic or looking at the Information & Plugins tab. 
These may require more services to be registered in the startup class. See specific plugins for details.