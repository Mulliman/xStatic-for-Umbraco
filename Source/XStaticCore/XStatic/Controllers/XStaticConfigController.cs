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
using XStatic.Models;

namespace XStatic.Controllers
{
    [PluginController("xstatic")]
    public class XStaticConfigController : UmbracoAuthorizedJsonController
    {
        private readonly IDeployerService _deployerService;

        public XStaticConfigController(IDeployerService deployerService)
        {
            _deployerService = deployerService;
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public ActionResult<XStaticConfig> Get()
        {
            var deployers = _deployerService.GetDefinitions();

            return new XStaticConfig
            {
                Deployers = deployers
            };
        }
    }
}
