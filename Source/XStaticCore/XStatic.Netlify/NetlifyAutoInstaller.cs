using System;
using System.Collections.Generic;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;

namespace XStatic.Netlify
{
    public class NetlifyAutoInstaller : IDeployerAutoInstaller, IDeploymentTargetCreatorAutoInstaller
    {
        IDeployerDefinition IDeployerAutoInstaller.Definition => new NetlifyDeployerDefinition();

        Func<Dictionary<string, string>, IDeployer> IDeployerAutoInstaller.Constructor => (x) => new NetlifyDeployer(x);

        IDeploymentTargetCreatorDefinition IDeploymentTargetCreatorAutoInstaller.Definition => new NetlifyDeploymentTargetCreatorDefinition();

        Func<Dictionary<string, string>, IDeploymentTargetCreator> IDeploymentTargetCreatorAutoInstaller.Constructor => (x) => new NetlifyDeploymentTargetCreator(x);
    }

    public class NetlifyLegacyAutoInstaller : IDeployerAutoInstaller
    {
        IDeployerDefinition IDeployerAutoInstaller.Definition => new NetlifyLegacyDeployerDefinition();

        Func<Dictionary<string, string>, IDeployer> IDeployerAutoInstaller.Constructor => (x) => new NetlifyDeployerLegacy(x);
    }
}