
===========================================
xStatic- Netlify
===========================================

Basic setup
-----------

You must add following extension method in the ConfigureServices method of your program class:

using XStatic.Core.App;
using XStatic.Netlify;

builder.Services.AddXStatic()
    .Automatic()
    .Build();

builder.Services.AddNetlifyActions();