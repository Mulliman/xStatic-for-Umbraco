using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Netlify
{
    public class NetlifyDeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string PAT = "Netlify.PAT";
            public const string SiteId = "Netlify.SiteId";
        }

        public string Id => NetlifyDeployer.DeployerKey;

        public string Name => "Netlify";

        public string Help => "First create a personal access token at <a target='_blank' href='https://app.netlify.com/user/applications'>https://app.netlify.com/user/applications</a>. <br/> Then go to the site settings for your site, and in Site details/Site information you should see an API ID.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias=FieldNames.PAT, Name = "Personal Access Token", EditorUiAlias = UIEditors.Password },
            new DeployerField { Alias=FieldNames.SiteId, Name = "Site ID", EditorUiAlias = UIEditors.Text },
        };
    }
}