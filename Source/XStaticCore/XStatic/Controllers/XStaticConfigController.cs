using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Umbraco.Cms.Web.BackOffice.Controllers;
using Umbraco.Cms.Web.Common.Attributes;
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

        public XStaticConfigController(IDeployerService deployerService, IExportTypeService exportTypeService)
        {
            _deployerService = deployerService;
            _exportTypeService = exportTypeService;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<XStaticConfig> Get()
        {
            var deployers = _deployerService.GetDefinitions();
            var exportTypes = _exportTypeService.GetExportTypes();

            return new XStaticConfig
            {
                Deployers = deployers,
                ExportTypes = exportTypes.Select(e => new ExportTypeModel(e))
            };
        }
    }
}
