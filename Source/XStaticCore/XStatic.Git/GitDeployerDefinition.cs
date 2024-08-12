using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Git
{
    public class GitDeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string RemoteUrl = "Git.RemoteUrl";
            public const string Email = "Git.Email";
            public const string Username = "Git.Uname";
            public const string Password = "Git.Pss";
            public const string Branch = "Git.Branch";
        }

        public string Id => GitDeployer.DeployerKey;

        public string Name => "Git";

        public string Help => "First create an empty git repo. This deployer will clone the remote and then push changes back on each deploy.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias=FieldNames.RemoteUrl, Name = "Remote URL", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias=FieldNames.Email, Name = "Email", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias=FieldNames.Username,  Name = "Username", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias=FieldNames.Password, Name = "Password", EditorUiAlias = UIEditors.Password },
            new DeployerField { Alias=FieldNames.Branch, Name = "Branch", EditorUiAlias = UIEditors.Text },
        };
    }
}