using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.ExportTypes
{
    public class DatabaseExportTypeService : IExportTypeService
    {
        private readonly IExportTypeRepository _repo;
        private readonly IServiceProvider _currentServiceProvider;

        public DatabaseExportTypeService(IExportTypeRepository repo, IServiceProvider currentServiceProvider)
        {
            _repo = repo;
            _currentServiceProvider = currentServiceProvider;
        }

        public IEnumerable<IExportTypeFields> GetExportTypes()
        {
            return _repo.GetAll();
        }

        public ITransformerListFactory GetTransformerListFactory(int exportFormatId)
        {
            var exportType = _repo.Get(exportFormatId);

            if (exportType?.TransformerFactory == null)
            {
                return new DefaultHtmlTransformerListFactory();
            }

            var typeName = exportType.TransformerFactory;
            var type = Type.GetType(typeName);
            var iocInstance = _currentServiceProvider.GetService(type) as ITransformerListFactory;

            if (iocInstance != null)
            {
                return iocInstance;
            }

            var factory = Activator.CreateInstance(type) as ITransformerListFactory;
            return factory;
        }

        public IGenerator GetGenerator(int exportFormatId)
        {
            var exportType = _repo.Get(exportFormatId);

            if (exportType?.Generator == null)
            {
                return _currentServiceProvider.GetService<StaticHtmlSiteGenerator>();
            }

            var typeName = exportType.Generator;
            var type = Type.GetType(typeName);

            var iocInstance = _currentServiceProvider.GetService(type) as IGenerator;

            if (iocInstance != null)
            {
                return iocInstance;
            }

            var generator = Activator.CreateInstance(type) as IGenerator;
            return generator;
        }

        public IFileNameGenerator GetFileNameGenerator(int exportFormatId)
        {
            var exportType = _repo.Get(exportFormatId);

            if (exportType?.FileNameGenerator == null)
            {
                return _currentServiceProvider.GetService<EverythingIsIndexHtmlFileNameGenerator>();
            }

            var typeName = exportType.FileNameGenerator;
            var type = Type.GetType(typeName);

            var iocInstance = _currentServiceProvider.GetService(type) as IFileNameGenerator;

            if (iocInstance != null)
            {
                return iocInstance;
            }

            var generator = Activator.CreateInstance(type) as IFileNameGenerator;
            return generator;
        }
    }
}