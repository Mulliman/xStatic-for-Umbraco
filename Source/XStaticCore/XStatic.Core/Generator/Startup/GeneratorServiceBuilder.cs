using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using XStatic.Generator.ExportTypes;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;
using XStatic.Repositories;

namespace XStatic.Generator.Startup
{
    public class GeneratorServiceBuilder
    {
        public readonly List<IExportType> _exportTypes;
        public readonly IServiceCollection _services;

        public GeneratorServiceBuilder(IServiceCollection services)
        {
            _exportTypes = new List<IExportType>();
            _services = services;
        }

        public GeneratorServiceBuilder AddDefaults()
        {
            _services.AddSingleton<IStaticSiteStorer, AppDataSiteStorer>();
            _services.AddSingleton<IImageCropNameGenerator, ImageCropNameGenerator>();
            _services.AddSingleton<StaticHtmlSiteGenerator>();
            _services.AddSingleton<JsonApiGenerator>();
            _services.AddSingleton<IExportTypeService, ExportTypeService>();
            _services.AddSingleton<ISitesRepository, SitesRepository>();

            _services.AddTransient<DefaultHtmlTransformerListFactory>();
            _services.AddTransient<DefaultJsonTransformerListFactory>();

            return this;
        }

        public void Build()
        {

        }
    }

    public static class GeneratorExtensions
    {
        public static GeneratorServiceBuilder AddXStaticGenerator(this IServiceCollection services)
        {
            return new GeneratorServiceBuilder(services);
        }
    }
}