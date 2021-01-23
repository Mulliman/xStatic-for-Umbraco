using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Hosting;
using System.Web.Mvc;
using XStatic.Generator;
using XStatic.Generator.Transformers;

namespace XStatic.Plugin.ExportType
{
    public class AppPluginsJsonExportTypeSettings : IExportTypeSettings
    {
        private const string FileLocation = @"~\App_Plugins\xStatic\xStaticConfig.json";

        public ITransformerListFactory GetTransformerListFactory(string exportFormatId)
        {
            var file = HostingEnvironment.MapPath(FileLocation);

            if (!File.Exists(file))
            {
                return new DefaultHtmlTransformerListFactory();
            }

            try
            {
                var config = JsonConvert.DeserializeObject<Config>(File.ReadAllText(file));
                var exportType = config?.exportTypes?.FirstOrDefault(et => et?.id == exportFormatId);

                if (exportType?.transformerFactory == null)
                {
                    return new DefaultHtmlTransformerListFactory();
                }

                var typeName = exportType.transformerFactory;
                var type = Type.GetType(typeName);
                var iocInstance = DependencyResolver.Current.GetService(type) as ITransformerListFactory;

                if(iocInstance != null)
                {
                    return iocInstance;
                }

                var factory = Activator.CreateInstance(type) as ITransformerListFactory;
                return factory;
            }
            catch
            {
                // TODO: add in logging
                return new DefaultHtmlTransformerListFactory();
            }
        }

        public IGenerator GetGenerator(string exportFormatId)
        {
            var file = HostingEnvironment.MapPath(FileLocation);

            if (!File.Exists(file))
            {
                return DependencyResolver.Current.GetService<StaticHtmlSiteGenerator>();
            }

            try
            {
                var config = JsonConvert.DeserializeObject<Config>(File.ReadAllText(file));
                var exportType = config?.exportTypes?.FirstOrDefault(et => et?.id == exportFormatId);

                if (exportType?.generator == null)
                {
                    return DependencyResolver.Current.GetService<StaticHtmlSiteGenerator>();
                }

                var typeName = exportType.generator;
                var type = Type.GetType(typeName);
                
                var iocInstance = DependencyResolver.Current.GetService(type) as IGenerator;

                if (iocInstance != null)
                {
                    return iocInstance;
                }

                var generator = Activator.CreateInstance(type) as IGenerator;
                return generator;
            }
            catch
            {
                // TODO: add in logging
                return DependencyResolver.Current.GetService<StaticHtmlSiteGenerator>();
            }
        }
    }

    public class Config
    {
        public IEnumerable<ExportType> exportTypes { get; set; }
    }

    public class ExportType
    {
        public string id { get; set; }

        public string name { get; set; }

        public string transformerFactory { get; set; }

        public string generator { get; set; }
    }
}