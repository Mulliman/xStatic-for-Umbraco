using System;
using System.Collections.Generic;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;

namespace XStatic.Cloudflare
{
    public class CloudflarePagesAutoInstaller : IDeployerAutoInstaller, IDeploymentTargetCreatorAutoInstaller
    {
        IDeployerDefinition IDeployerAutoInstaller.Definition => new CloudflarePagesDeployerDefinition();

        Func<Dictionary<string, string>, IDeployer> IDeployerAutoInstaller.Constructor => (x) => new CloudflarePagesDeployer(x);

        IDeploymentTargetCreatorDefinition IDeploymentTargetCreatorAutoInstaller.Definition => new CloudflarePagesDeploymentTargetCreatorDefinition();

        Func<Dictionary<string, string>, IDeploymentTargetCreator> IDeploymentTargetCreatorAutoInstaller.Constructor => (x) => new CloudflarePagesDeploymentTargetCreator(x);
    }

    public class CloudflareWorkersAutoInstaller : IDeployerAutoInstaller, IDeploymentTargetCreatorAutoInstaller
    {
        IDeployerDefinition IDeployerAutoInstaller.Definition => new CloudflareWorkersDeployerDefinition();

        Func<Dictionary<string, string>, IDeployer> IDeployerAutoInstaller.Constructor => (x) => new CloudflareWorkersDeployer(x);

        IDeploymentTargetCreatorDefinition IDeploymentTargetCreatorAutoInstaller.Definition => new CloudflareWorkersDeploymentTargetCreatorDefinition();

        Func<Dictionary<string, string>, IDeploymentTargetCreator> IDeploymentTargetCreatorAutoInstaller.Constructor => (x) => new CloudflareWorkersDeploymentTargetCreator(x);
    }

    public class CloudflareR2AutoInstaller : IDeployerAutoInstaller
    {
        IDeployerDefinition IDeployerAutoInstaller.Definition => new CloudflareR2DeployerDefinition();

        Func<Dictionary<string, string>, IDeployer> IDeployerAutoInstaller.Constructor => (x) => new CloudflareR2Deployer(x);
    }
}
