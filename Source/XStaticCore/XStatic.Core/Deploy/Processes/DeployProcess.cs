using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using XStatic.Core.Secrets;

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
                throw new XStaticException($"Failed to deploy. No generated output found at '{path}'. Generate the site before deploying.");
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

            IDeployer deployer;

            try
            {
                deployer = _deployerFactory.GetDeployer(deploymentTarget.DeployerDefinition, deploymentTarget.Config);
            }
            catch (SecretReferenceException e)
            {
                // The message names the missing or blocked variable, never its value, so it's safe to show.
                return XStaticResult.Error($"Failed to deploy. {e.Message}", e);
            }

            var result = await deployer.DeployWholeSite(path);

            stopwatch.Stop();

            // Only record a deploy that worked, so a failed one doesn't look like the site is live.
            if (result?.WasSuccessful == true)
            {
                _sitesRepo.UpdateLastDeploy(staticSiteId, (int)(stopwatch.ElapsedMilliseconds / 1000));
            }

            return result;
        }
    }
}