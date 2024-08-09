
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