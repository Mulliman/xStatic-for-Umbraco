# xStatic v17+ Extension Templates

Complete, verified C# examples targeting **.NET 10** and **Umbraco 17+**.

## 1. Custom `IGenerator` (subclassing `GeneratorBase`)

```csharp
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Routing;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;
using XStatic.Core.App;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace MySite.XStatic;

public class CustomHtmlGenerator : GeneratorBase
{
    public CustomHtmlGenerator(
        IUmbracoContextFactory umbracoContextFactory,
        IPublishedUrlProvider publishedUrlProvider,
        IStaticSiteStorer storer,
        IImageCropNameGenerator imageCropNameGenerator,
        MediaFileManager mediaFileSystem,
        IWebHostEnvironment hostingEnvironment,
        IOptions<XStaticGlobalSettings> globalSettings,
        ILogger<CustomHtmlGenerator> logger)
        : base(
            umbracoContextFactory,
            publishedUrlProvider,
            storer,
            imageCropNameGenerator,
            mediaFileSystem,
            hostingEnvironment,
            globalSettings,
            logger)
    {
    }

    public override async Task<GenerateItemResult> GeneratePage(
        int id,
        int staticSiteId,
        IFileNameGenerator fileNamer,
        IEnumerable<ITransformer> transformers = null,
        string culture = null)
    {
        var node = GetNode(id);
        if (node == null || node.TemplateId == null)
        {
            return null;
        }

        try
        {
            var relativeUrl = node.Url(_publishedUrlProvider, mode: UrlMode.Relative, culture: culture);
            var absoluteUrl = node.Url(_publishedUrlProvider, mode: UrlMode.Absolute, culture: culture);

            var html = await GetFileDataFromWebClient(absoluteUrl);
            var transformed = RunTransformers(html, transformers);
            var filePath = fileNamer.GetFilePartialPath(relativeUrl);
            var outputPath = await Store(staticSiteId, filePath, transformed);

            return GenerateItemResult.Success("Page", node.UrlSegment, outputPath);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error generating page {UrlSegment}", node.UrlSegment);
            return GenerateItemResult.Error("Page", node.UrlSegment, ex.Message);
        }
    }
}
```

## 2. Custom `ITransformer` + `ITransformerListFactory`

```csharp
using System.Collections.Generic;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Transformers;

namespace MySite.XStatic;

public class CdnPrefixTransformer(string cdnBaseUrl) : ITransformer
{
    private readonly string _cdnBaseUrl = cdnBaseUrl.TrimEnd('/');

    public string Transform(string input, IUmbracoContext context)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input;
        }

        return input.Replace("src=\"/media/", $"src=\"{_cdnBaseUrl}/media/");
    }
}

public class CdnHtmlTransformerListFactory : DefaultHtmlTransformerListFactory
{
    private const string MediaCdnBaseUrl = "https://cdn.example.com";

    public override IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig)
    {
        foreach (var transformer in base.BuildTransformers(siteConfig))
        {
            yield return transformer;
        }

        // Apply a dedicated CDN base URL (distinct from siteConfig.TargetHostname, which HostnameTransformer uses)
        yield return new CdnPrefixTransformer(MediaCdnBaseUrl);
    }
}
```

## 3. Custom `IPostGenerationAction`

```csharp
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using XStatic;
using XStatic.Core;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Storage;

namespace MySite.XStatic;

public static class RobotsTxtFields
{
    public const string Content = "RobotsContent";
}

[XStaticEditableField(RobotsTxtFields.Content, UIEditors.TextArea)]
public class GenerateRobotsTxtAction(IStaticSiteStorer storer) : PostGenerationActionBase
{
    private readonly IStaticSiteStorer _storer = storer;

    public override string Name => nameof(GenerateRobotsTxtAction);

    public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
    {
        var content = GetParameter(parameters, RobotsTxtFields.Content);
        if (string.IsNullOrWhiteSpace(content))
        {
            return XStaticResult.Error("RobotsContent parameter is required.");
        }

        try
        {
            await _storer.StoreSiteItem(staticSiteId.ToString(), "/robots.txt", content, Encoding.UTF8);
            return XStaticResult.Success("Generated robots.txt.");
        }
        catch (Exception ex)
        {
            return XStaticResult.Error("Failed to generate robots.txt.", ex);
        }
    }
}
```

## 4. Custom `IDeployer` + `IDeployerDefinition` + `IDeployerAutoInstaller`

```csharp
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using XStatic;
using XStatic.Core;
using XStatic.Core.Deploy;

namespace MySite.XStatic;

public class WebhookDeployerDefinition : IDeployerDefinition
{
    public static class FieldNames
    {
        public const string EndpointUrl = "Webhook.EndpointUrl";
        public const string BearerToken = "Webhook.BearerToken";
    }

    public string Id => WebhookDeployer.DeployerKey;
    public string Name => "Webhook Deployer";
    public string Help => "Notifies a remote build/deploy webhook after static files are ready.";

    public IEnumerable<DeployerField> Fields =>
    [
        new DeployerField
        {
            Alias = FieldNames.EndpointUrl,
            Name = "Webhook URL",
            EditorUiAlias = UIEditors.Text,
        },
        new DeployerField
        {
            Alias = FieldNames.BearerToken,
            Name = "Bearer Token",
            EditorUiAlias = UIEditors.Password,
        },
    ];
}

public class WebhookDeployer(Dictionary<string, string> parameters) : IDeployer
{
    public const string DeployerKey = "webhook";

    private readonly string _endpointUrl = parameters[WebhookDeployerDefinition.FieldNames.EndpointUrl];
    private readonly string _bearerToken = parameters.TryGetValue(WebhookDeployerDefinition.FieldNames.BearerToken, out var token) ? token : null;

    public async Task<XStaticResult> DeployWholeSite(string folderPath)
    {
        try
        {
            using var http = new HttpClient();
            if (!string.IsNullOrWhiteSpace(_bearerToken))
            {
                http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _bearerToken);
            }

            var response = await http.PostAsync(_endpointUrl, new StringContent(string.Empty));
            if (!response.IsSuccessStatusCode)
            {
                return XStaticResult.Error($"Webhook returned {(int)response.StatusCode} {response.ReasonPhrase}.");
            }

            return XStaticResult.Success("Webhook triggered successfully.");
        }
        catch (Exception ex)
        {
            return XStaticResult.Error("Error invoking deployment webhook.", ex);
        }
    }
}

public class WebhookDeployerAutoInstaller : IDeployerAutoInstaller
{
    public IDeployerDefinition Definition => new WebhookDeployerDefinition();
    public Func<Dictionary<string, string>, IDeployer> Constructor => parameters => new WebhookDeployer(parameters);
}
```

## 5. DI Registration (`IComposer`)

```csharp
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace MySite.XStatic;

public class MyXStaticExtensionsComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<CustomHtmlGenerator>();
        builder.Services.AddTransient<CdnHtmlTransformerListFactory>();
        builder.Services.AddTransient<GenerateRobotsTxtAction>();
        // WebhookDeployerAutoInstaller is discovered automatically by DeployServiceBuilder.AddDeployersAutomatically()
    }
}
```
