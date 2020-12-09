﻿using System;
using System.CodeDom;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using Umbraco.Web.WebApi;
using XStatic.Deploy;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;
using XStatic.Plugin.Repositories;


namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class DeployController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerFactory _deployerFactory;
        private SitesRepository _sitesRepo;

        public DeployController(IStaticSiteStorer storer, IDeployerFactory deployerFactory)
        {
            _storer = storer;
            _deployerFactory = deployerFactory;
            _sitesRepo = new SitesRepository();
        }

        [HttpGet]
        public async Task<string> DeployStaticSite(int staticSiteId)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var entity = _sitesRepo.Get(staticSiteId);

            if(entity == null)
            {
                throw new HttpException(404, "Site not found with id " + staticSiteId);
            }

            var path = _storer.GetStorageLocationOfSite(entity.Id);

            if (!Directory.Exists(path))
            {
                throw new FileNotFoundException();
            }

            var deployer = _deployerFactory.GetDeployer(entity.DeploymentTarget.id, entity.DeploymentTarget.fields);

            var results = await deployer.DeployWholeSite(path);

            stopwatch.Stop();
            _sitesRepo.UpdateLastDeploy(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

            return results.WasSuccessful.ToString();
        }

        
    }
}