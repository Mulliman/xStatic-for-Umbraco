# Generators

A generator defines how a umbraco nodes are turned into static files. Generally speaking, to create static HTML websites you will not need to create a custom implementation of this, you can customise your output with custom namers and transformers; if you need to create a different file type however, you can create your own custom generators. 

## Creating a custom generator

Custom generators can be created by implementing the `IGenerator` interface, but the easiest way is to inherit `GeneratorBase`. When inheriting this class all you have to do is implement the `GeneratePage` method using the myriad protected methods within the base class to help you out.

Generally speaking, the order of operations is to generate the static output, run any transformers on that output, compute the file name, and then store the generated file.

```
public class StaticHtmlSiteGenerator : GeneratorBase
{
    public StaticHtmlSiteGenerator(IUmbracoContextFactory umbracoContextFactory,
        IPublishedUrlProvider publishedUrlProvider,
        IStaticSiteStorer storer,
        IImageCropNameGenerator imageCropNameGenerator,
        MediaFileManager mediaFileSystem,
        IWebHostEnvironment hostingEnvironment)
        : base(umbracoContextFactory, publishedUrlProvider, storer, imageCropNameGenerator, mediaFileSystem, hostingEnvironment)
    {
    }

    public override async Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null)
    {
        SslTruster.TrustSslIfAppSettingConfigured();

        var node = GetNode(id);

        if (node == null)
        {
            return null;
        }

        try
        {
            var url = node.Url(_publishedUrlProvider, mode: UrlMode.Relative);
            string absoluteUrl = node.Url(_publishedUrlProvider, mode: UrlMode.Absolute);

            var fileData = await GetFileDataFromWebClient(absoluteUrl);

            var transformedData = RunTransformers(fileData, transformers);

            var filePath = fileNamer.GetFilePartialPath(url);

            var generatedFileLocation = await Store(staticSiteId, filePath, transformedData);

            return GenerateItemResult.Success("Page", node.UrlSegment, generatedFileLocation);
        }
        catch (Exception e)
        {
            return GenerateItemResult.Error("Page", node.UrlSegment, e.Message);
        }
    }
}
```

## Using the Custom Generator

Implementations of IGenerator will automatically get discovered by xStatic and will be available for selection withing the export type dashboard with the CMS. If you are using parameters in the constructor (which you almost certainly will be) you need to register this class in your Startup ConfigureServices method.