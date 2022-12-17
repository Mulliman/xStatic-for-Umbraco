# Deployers

A deployer in xStatic is a component that takes a folder of static files and pushes it to a remote location. Creating your own deployer is fairly straightforward, but check NuGet first for any open source xStatic extensions.

Deployer implementations are split into 2 mandatory classes and 2 optional (but recommended) classes.

## Deployer

The deployer is the class that does the actual work. Simply implement the `IDeployer` interface and write your custom code in the DeployWholeSite method. The folder path of the folder containing the static files is passed in as an argument. 

The expected constructor for the deploy includes a dictionary of strings as the parameter. This parameter contains all the field values that the user has filled in on the CMS dashboard. These fields shown to the user are defined in the definition class.

```
public class FtpDeployer : IDeployer
{
    public const string DeployerKey = "ftp";
    private readonly string _hostname;
    private readonly int _port;
    private readonly string _username;
    private readonly string _password;
    private readonly string _folder;

    public FtpDeployer(Dictionary<string, string> parameters)
    {
        _hostname = parameters["Hostname"];
        _username = parameters["Username"];
        _password = parameters["Password"];
        _folder = parameters["Folder"];

        _port = 21;
        int.TryParse(parameters["Port"], out _port);
    }

    public virtual Task<XStaticResult> DeployWholeSite(string folderPath)
    {
        return TaskHelper.FromResultOf(() =>
        {
            return Deploy(folderPath);
        });
    }

    public virtual XStaticResult Deploy(string folderPath)
    {
        try
        {
            // Do the upload
        }
        catch (Exception e)
        {
            return XStaticResult.Error("Error deploying the site using FTP.", e);
        }

        return XStaticResult.Success("Site deployed using FTP.");
    }
}
```

## Deployer Definition

Implementing the `IDeployerDefinition` interface allows you to set the metadata for your custom deployer. The ID must be unique; there will be errors if two definitions are added with the same ID.

```
public class FtpDeployerDefinition : IDeployerDefinition
{
    public string Id => FtpDeployer.DeployerKey;

    public string Name => "FTP";

    public string Help => "The remote FTP files will be mirrored to match the generated site.";

    public IEnumerable<string> Fields => new[]
    {
        "Hostname",
        "Username",
        "Password",
        "Folder",
        "Port"
    };
}
```

## Auto Installer (recommended)

There are two ways to ensure that your custom deployers appear in xStatic. Implementing the `IDeployerAutoInstaller` couples together the definition and the deployer. These are then automatically found by xStatic when you use .AddDeployersAutomatically() on the DeployServiceBuilder. By default the `services.AddXStatic().Automatic().Build();` call in the startup class uses the `Automatic` method, which calls this extension behind the scenes.

```
public class FtpAutoInstaller : IDeployerAutoInstaller
{
    public IDeployerDefinition Definition => new FtpDeployerDefinition();

    public Func<Dictionary<string, string>, IDeployer> Constructor => (x) => new FtpDeployer(x);
}
```

## Extensions (optional)

The second way to ensure that your custom deployers appear in xStatic is to manually add your deployer to the DeployServiceBuilder. While you can do this directly in the startup class, the recommended way is to create an extension method as shown below.

```
public static IDeployServiceBuilder AddFtpDeployer(this IDeployServiceBuilder builder)
{
    builder.AddDeployer(new FtpDeployerDefinition(), (x) => new FtpDeployer(x));

    return builder;
}
```

This can then be added in the startup class like below

```
var builder = services.AddXStatic();
builder.DeployServiceBuilder.AddFtpDeployer();

// You'll need to manually register more stuff too...
builder.Build();
```