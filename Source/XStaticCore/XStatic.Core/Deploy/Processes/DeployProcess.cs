using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Common;
using XStatic.Deploy;
using XStatic.Generator.Storage;
using XStatic.Plugin;
using XStatic.Repositories;

namespace XStatic.Core.Deploy.Processes
{
    public class DeployProcess
    {
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerService _deployerFactory;
        private ISitesRepository _sitesRepo;

        public DeployProcess(IStaticSiteStorer storer, IDeployerService deployerFactory, ISitesRepository sitesRepo)
        {
            _storer = storer;
            _deployerFactory = deployerFactory;
            _sitesRepo = sitesRepo;
        }

        public async Task<XStaticResult> DeployStaticSite(int staticSiteId)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var entity = _sitesRepo.Get<SiteConfig>(staticSiteId);

            if (entity == null)
            {
                throw new XStaticException("Failed to deploy. Site not found with id " + staticSiteId);
            }

            var path = _storer.GetStorageLocationOfSite(entity.Id);

            if (!Directory.Exists(path))
            {
                throw new FileNotFoundException();
            }

            var deployer = _deployerFactory.GetDeployer(entity.DeploymentTarget.Id, entity.DeploymentTarget.Fields);

            var result = await deployer.DeployWholeSite(path);

            stopwatch.Stop();
            _sitesRepo.UpdateLastDeploy(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

            return result;
        }
    }
}