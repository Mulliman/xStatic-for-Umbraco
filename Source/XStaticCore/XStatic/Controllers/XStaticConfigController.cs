using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
using XStatic.Core.Generator;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using XStatic.Core.Models;
using XStatic.Deploy;
using XStatic.Generator;
using XStatic.Models;

namespace XStatic.Controllers
{
    [PluginController("xstatic")]
    public class XStaticConfigController : UmbracoAuthorizedJsonController
    {
        private readonly IDeployerService _deployerService;
        private readonly IExportTypeService _exportTypeService;
        private readonly IExportTypeRepository _repo;
        private readonly GeneratorList _generatorList;
        private readonly TransformerList _transformerList;
        private readonly FileNameGeneratorList _fileNameGeneratorList;

        public XStaticConfigController(IDeployerService deployerService, 
            IExportTypeService exportTypeService, 
            IExportTypeRepository repo,
            GeneratorList generatorList,
            TransformerList transformerList,
            FileNameGeneratorList fileNameGeneratorList)
        {
            _deployerService = deployerService;
            _exportTypeService = exportTypeService;
            _repo = repo;
            _generatorList = generatorList;
            _transformerList = transformerList;
            _fileNameGeneratorList = fileNameGeneratorList;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<XStaticConfig> Get()
        {
            var deployers = _deployerService.GetDefinitions();
            var exportTypes = _exportTypeService.GetExportTypes();

            return new XStaticConfig
            {
                Deployers = deployers.Select(d => new DeployerModel(d)),
                ExportTypes = exportTypes.Select(e => new ExportTypeModel(e)),
                Generators = _generatorList.Generators.Select(g => new Core.Models.TypeModel(g)).ToList(),
                TransformerFactories = _transformerList.TransformerListFactories.Select(g => new Core.Models.TypeModel(g)).ToList(),
                FileNameGenerators = _fileNameGeneratorList.FileNameGenerators.Select(g => new Core.Models.TypeModel(g)).ToList()
            };
        }

        [HttpPost]
        public ExportTypeModel CreateExportType([FromBody] ExportTypeUpdateModel model)
        {
            var dataModel = new ExportTypeDataModel
            {
                Name = model.Name,
                Generator = model.Generator,
                TransformerFactory = model.TransformerFactory,
                FileNameGenerator = model.FileNameGenerator
            };

            var entity = _repo.Create(dataModel);

            return new ExportTypeModel(entity);
        }

        [HttpPost]
        public ExportTypeModel UpdateExportType([FromBody] ExportTypeUpdateModel model)
        {
            var dataModel = new ExportTypeDataModel
            {
                Id = model.Id,
                Name = model.Name,
                Generator = model.Generator,
                TransformerFactory = model.TransformerFactory,
                FileNameGenerator = model.FileNameGenerator
            };

            var entity = _repo.Update(dataModel);

            return new ExportTypeModel(entity);
        }

        [HttpDelete]
        public void DeleteExportType(int id)
        {
            _repo.Delete(id);
        }
    }
}
