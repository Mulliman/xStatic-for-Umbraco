using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Ftp
{
    public class FtpDeployerDefinition : IDeployerDefinition
    {
        public string Id => FtpDeployer.DeployerKey;

        public string Name => "FTP";

        public string Help => "The remote FTP files will be mirrored to match the generated site.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Name = "Hostname", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Username", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Password", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Folder", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
            new DeployerField { Name = "Port", EditorUiAlias = "Umb.PropertyEditorUi.TextBox" },
        };
    }
}