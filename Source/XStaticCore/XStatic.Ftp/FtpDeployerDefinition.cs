using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Ftp
{
    public class FtpDeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string Hostname = "FTP.Hostname";
            public const string Username = "FTP.Uname";
            public const string Password = "FTP.Pss";
            public const string Folder = "FTP.Folder";
            public const string Port = "FTP.Port";
        }

        public string Id => FtpDeployer.DeployerKey;

        public string Name => "FTP";

        public string Help => "The remote FTP files will be mirrored to match the generated site.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias=FieldNames.Hostname, Name = "Hostname", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias=FieldNames.Username, Name = "Username", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias=FieldNames.Password, Name = "Password", EditorUiAlias = UIEditors.Password },
            new DeployerField { Alias=FieldNames.Folder, Name = "Folder", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias=FieldNames.Port, Name = "Port", EditorUiAlias = UIEditors.Text },
        };
    }
}