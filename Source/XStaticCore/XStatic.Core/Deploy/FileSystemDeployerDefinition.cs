using System.Collections.Generic;

namespace XStatic.Core.Deploy
{
    public class FileSystemDeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string FolderPath = "File.FolderPath";
        }

        public string Id => FileSystemDeployer.DeployerKey;

        public string Name => "File System";

        public string Help => "Deploys the contents of the site to a folder path";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField
            {
                Alias = FieldNames.FolderPath,
                Name = "Folder Path",
                EditorUiAlias = UIEditors.Text
            }
        };
    }
}