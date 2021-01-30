using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using XStatic.Deploy;
using XStatic.Generator.Storage;
using XStatic.Library;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Processes
{
    public class DeployProcess
    {
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerFactory _deployerFactory;
        private SitesRepository _sitesRepo;

        public DeployProcess(IStaticSiteStorer storer, IDeployerFactory deployerFactory, SitesRepository sitesRepo)
        {
            _storer = storer;
            _deployerFactory = deployerFactory;
            _sitesRepo = sitesRepo;
        }

        public async Task<XStaticResult> DeployStaticSite(int staticSiteId)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var entity = _sitesRepo.Get(staticSiteId);

            if (entity == null)
            {
                throw new HttpException(404, "Site not found with id " + staticSiteId);
            }

            var path = _storer.GetStorageLocationOfSite(entity.Id);

            if (!Directory.Exists(path))
            {
                throw new FileNotFoundException();
            }

            var deployer = _deployerFactory.GetDeployer(entity.DeploymentTarget.id, entity.DeploymentTarget.fields);

            var result = await deployer.DeployWholeSite(path);

            stopwatch.Stop();
            _sitesRepo.UpdateLastDeploy(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

            return result;
        }
    }
}