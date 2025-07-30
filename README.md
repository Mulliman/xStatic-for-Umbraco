# xStatic-for-Umbraco
This is a static site generator built for Umbraco so that you can host simple Umbraco sites on fast and cheap hosting providers such as netlify.

For more information on why it could be of use to you, please visit https://www.sammullins.co.uk/software/xstatic-for-umbraco/

xStatic can be extended to meet specific needs and documentation for this can be found at https://www.sammullins.co.uk/software/xstatic-for-umbraco/extending-xstatic/

## Getting started

1. Ensure that Umbraco is installed and working before running the site with xStatic installed. 

2. Add the following to the ConfigureServices method in your Startup.cs file

```
services.AddXStatic()
.Automatic()
.Build();
```

or, if you need to allow generating without a proper SSL certificate, use this:

```
services.AddXStatic()
.Automatic()
.TrustUnsafeSslConnectionWhenGenerating()
.Build();
```

You will need to add `using XStatic.Core.App;` to the top of the file.

This will automatically register all the built in services as required for an out of the box solution.

3. Ensure that the `\App_Plugins\xStatic` folder and files are included in your csproj. These need to be present in your website for the xStatic section to appear.

4. In the users section, add 'xStatic Generated Sites' to the roles you want to have access.

5. Create your site configs and build / deploy your static sites.