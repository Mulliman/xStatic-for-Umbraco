using System.Collections.Generic;

namespace XStatic.Core.Deploy
{
    public class FileSystemDeployerDefinition : IDeployerDefinition
    {
        public string Id => FileSystemDeployer.DeployerKey;

        public string Name => "File System";

        public string Help => "Deploys the contents of the site to a folder path";

        public IEnumerable<string> Fields => new[] { "FolderPath" };

        IEnumerable<DeployerField> IDeployerDefinition.Fields => new[]
        {
            new DeployerField
            {
                Name = "FolderPath",
                EditorUiAlias = "Umb.PropertyEditorUi.TextBox"
            }
        };
    }
}