using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Deploy;

namespace XStatic.Git
{
    public class GitDeployerDefinition : IDeployerDefinition
    {
        public string Id => GitDeployer.DeployerKey;

        public string Name => "Git";

        public string Help => "First create an empty git repo. This deployer will clone the remote and then push changes back on each deploy.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Name = "RemoteUrl", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Email", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Username", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Password", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Branch", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
        };
    }
}