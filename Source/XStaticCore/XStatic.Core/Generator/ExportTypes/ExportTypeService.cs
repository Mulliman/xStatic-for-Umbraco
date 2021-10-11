using System.Collections.Generic;
using System.Linq;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public class ExportTypeService : IExportTypeService
    {
        private readonly List<IExportType> _exportTypes;

        public ExportTypeService()
        {
            _exportTypes = new List<IExportType>();
        }

        public void AddExportType(IExportType exportType)
        {
            _exportTypes.Add(exportType);
        }

        public IEnumerable<IExportType> GetExportTypes()
        {
            return _exportTypes;
        }

        public ITransformerListFactory GetTransformerListFactory(string exportFormatId)
        {
            var match = _exportTypes.FirstOrDefault(e => e.Id == exportFormatId);

            if (match != null)
            {
                return match.TransformerFactory;
            }

            return null;
        }

        public IGenerator GetGenerator(string exportFormatId)
        {
            var match = _exportTypes.FirstOrDefault(e => e.Id == exportFormatId);

            if (match != null)
            {
                return match.Generator;
            }

            return null;
        }
    }
}