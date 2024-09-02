using System;
using System.Collections.Generic;

namespace XStatic.Core.Deploy.Targets.Creators
{
    public interface IDeploymentTargetCreatorAutoInstaller
    {
        public IDeploymentTargetCreatorDefinition Definition { get; }

        public Func<Dictionary<string, string>, IDeploymentTargetCreator> Constructor { get; }
    }
}
