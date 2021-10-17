using Microsoft.Extensions.DependencyInjection;
using System.Collections.Generic;
using XStatic.Core.Generator;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
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

        public GeneratorServiceBuilder AddDefaultSiteRepository()
        {
            _services.AddSingleton<ISitesRepository, SitesRepository>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultExportTypeServices()
        {
            _services.AddSingleton<IExportTypeService, DatabaseExportTypeService>();
            _services.AddSingleton<IExportTypeRepository, ExportTypeRepository>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultHtmlGeneratorServices()
        {
            _services.AddSingleton<StaticHtmlSiteGenerator>();
            _services.AddTransient<DefaultHtmlTransformerListFactory>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultJsonGeneratorServices()
        {
            _services.AddSingleton<JsonApiGenerator>();
            _services.AddTransient<DefaultJsonTransformerListFactory>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultImageCropServices()
        {
            _services.AddSingleton<IImageCropNameGenerator, ImageCropNameGenerator>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultSiteStorageServices()
        {
            _services.AddSingleton<IStaticSiteStorer, AppDataSiteStorer>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultComponentLists()
        {
            _services.AddSingleton<GeneratorList>();
            _services.AddSingleton<TransformerList>();
            _services.AddSingleton<FileNameGeneratorList>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaults()
        {
            return AddDefaultSiteRepository()
                .AddDefaultComponentLists()
                .AddDefaultExportTypeServices()
                .AddDefaultHtmlGeneratorServices()
                .AddDefaultImageCropServices()
                .AddDefaultSiteStorageServices();
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