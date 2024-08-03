using System.Collections.Generic;
using XStatic.Core.Deploy.Targets.Db;

namespace XStatic.Core.Deploy.Targets
{
    public class DeploymentTargetEditorModel : DeploymentTargetDataModel
    {
        public string Name { get; set; }

        public Dictionary<string, string> Fields { get; set; }
    }
}