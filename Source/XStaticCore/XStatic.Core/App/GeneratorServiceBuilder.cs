using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using XStatic.Core.Actions;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.AutoPublish;
using XStatic.Core.Generator;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Repositories;
using XStatic.Generator;

namespace XStatic.Core.App
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

        public GeneratorServiceBuilder AddDefaultActionServices()
        {
            _services.AddSingleton<IActionRepository, ActionRepository>();
            _services.AddSingleton<IActionFactory, ActionFactory>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultActions()
        {
            _services.AddTransient<FileCopyAction>();
            _services.AddTransient<FileDeleteAction>();
            _services.AddTransient<FileRenameAction>();

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
            _services.AddSingleton<BasicJsonApiGenerator>();
            _services.AddTransient<DefaultJsonTransformerListFactory>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultImageCropServices()
        {
            _services.AddSingleton<IImageCropNameGenerator, ImageCropNameGenerator>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultSiteStorageServices(string outputFolderName = null)
        {
            _services.AddSingleton<IStaticSiteStorer>(serviceProvider =>
            {
                var webHostEnvironment = serviceProvider.GetRequiredService<IWebHostEnvironment>();
                var logger = serviceProvider.GetRequiredService<ILogger<IStaticSiteStorer>>();
                return new AppDataSiteStorer(webHostEnvironment, logger, outputFolderName);
            });

            return this;
        }

        public GeneratorServiceBuilder AddDefaultAutoDeployServices()
        {
            _services.AddSingleton<IAutoPublisher, DefaultAutoPublisher>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaultComponentLists()
        {
            _services.AddSingleton<GeneratorList>();
            _services.AddSingleton<TransformerList>();
            _services.AddSingleton<FileNameGeneratorList>();
            _services.AddSingleton<PostGenerationActionsList>();

            return this;
        }

        public GeneratorServiceBuilder AddDefaults(string outputFolderName = null)
        {
            return AddDefaultSiteRepository()
                .AddDefaultComponentLists()
                .AddDefaultExportTypeServices()
                .AddDefaultActionServices()
                .AddDefaultActions()
                .AddDefaultHtmlGeneratorServices()
                .AddDefaultJsonGeneratorServices()
                .AddDefaultImageCropServices()
                .AddDefaultAutoDeployServices()
                .AddDefaultSiteStorageServices(outputFolderName);
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
