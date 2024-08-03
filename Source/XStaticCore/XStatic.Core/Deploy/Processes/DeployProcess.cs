using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.Core.Deploy.Processes
{
    public class DeployProcess
    {
        private readonly IStaticSiteStorer _storer;
        private readonly IDeployerService _deployerFactory;
        private readonly IDeploymentTargetRepository _deployerTargetRepo;
        private ISitesRepository _sitesRepo;

        public DeployProcess(IStaticSiteStorer storer, IDeploymentTargetRepository deploymentTargetRepo, IDeployerService deployerFactory, ISitesRepository sitesRepo)
        {
            _storer = storer;
            _deployerFactory = deployerFactory;
            _deployerTargetRepo = deploymentTargetRepo;
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

            if(entity.DeploymentTarget == null)
            {
                throw new XStaticException("Failed to deploy. Deployment target null");
            }

            var deploymentTarget = _deployerTargetRepo.Get(entity.DeploymentTarget.Value);

            if (deploymentTarget == null)
            {
                throw new XStaticException("Failed to deploy. Deployment target not found with id " + entity.DeploymentTarget);
            }

            var deployer = _deployerFactory.GetDeployer(deploymentTarget.DeployerDefinition, deploymentTarget.Config);

            var result = await deployer.DeployWholeSite(path);

            stopwatch.Stop();
            _sitesRepo.UpdateLastDeploy(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));

            return result;
        }
    }
}