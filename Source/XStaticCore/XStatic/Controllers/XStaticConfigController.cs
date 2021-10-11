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
using XStatic.Core.Generator.Transformers;
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
        private readonly GeneratorList _generatorList;
        private readonly TransformerList _transformerList;

        public XStaticConfigController(IDeployerService deployerService, 
            IExportTypeService exportTypeService, 
            GeneratorList generatorList,
            TransformerList transformerList)
        {
            _deployerService = deployerService;
            _exportTypeService = exportTypeService;
            _generatorList = generatorList;
            _transformerList = transformerList;
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
                TransformerFactories = _transformerList.TransformerListFactories.Select(g => new Core.Models.TypeModel(g)).ToList()
            };
        }
    }
}
