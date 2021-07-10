using Microsoft.AspNetCore.Builder;
using System;
using Microsoft.Extensions.DependencyInjection;
using XStatic.Generator.Transformers;
using XStatic.Generator.ExportTypes;

namespace XStatic.Generator.Startup
{
    public class GeneratorApp
    {
        private IServiceProvider _services;
        private IExportTypeService _exportTypeService;

        public GeneratorApp(IServiceProvider services)
        {
            _services = services;
            _exportTypeService = _services.GetService<IExportTypeService>();
        }

        public GeneratorApp WithDefaultHtmlExportType(string id = null, string name = null)
        {
            var type = new CustomExportType
            {
                Name = name ?? "HTML Site",
                Id = id ?? "html",
                Generator = _services.GetService<StaticHtmlSiteGenerator>(),
                TransformerFactory = _services.GetService<DefaultHtmlTransformerListFactory>()
            };

            _exportTypeService.AddExportType(type);

            return this;
        }

        public GeneratorApp WithDefaultJsonExportType(string id = null, string name = null)
        {
            var type = new CustomExportType
            {
                Name = name ?? "JSON API",
                Id = id ?? "json",
                Generator = _services.GetService<JsonApiGenerator>(),
                TransformerFactory = _services.GetService<DefaultJsonTransformerListFactory>()
            };

            _exportTypeService.AddExportType(type);

            return this;
        }

        public GeneratorApp WithExportType<TGenerator, TTranformerListFactory>(string id, string name) where TGenerator : IGenerator where TTranformerListFactory : ITransformerListFactory
        {
            var type = new CustomExportType
            {
                Name = name,
                Id = id,
                Generator = _services.GetService<TGenerator>(),
                TransformerFactory = _services.GetService<TTranformerListFactory>()
            };

            _exportTypeService.AddExportType(type);

            return this;
        }

        public GeneratorApp WithExportType<TGenerator>(string id, string name, ITransformerListFactory transformerListFactory) where TGenerator : IGenerator
        {
            var type = new CustomExportType
            {
                Name = name,
                Id = id,
                Generator = _services.GetService<TGenerator>(),
                TransformerFactory = transformerListFactory
            };

            _exportTypeService.AddExportType(type);

            return this;
        }

        public GeneratorApp WithExportType(string id, string name, IGenerator generator, ITransformerListFactory transformerListFactory)
        {
            var type = new CustomExportType
            {
                Name = name,
                Id = id,
                Generator = generator,
                TransformerFactory = transformerListFactory
            };

            _exportTypeService.AddExportType(type);

            return this;
        }
    }

    public static class GeneratorAppExtensions
    {
        public static GeneratorApp UseXStatic(this IApplicationBuilder app)
        {
            return new GeneratorApp(app.ApplicationServices);
        }
    }
}
