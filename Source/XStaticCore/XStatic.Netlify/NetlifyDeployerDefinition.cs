using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Netlify
{
    public class NetlifyDeployerDefinition : IDeployerDefinition
    {
        public string Id => NetlifyDeployer.DeployerKey;

        public string Name => "Netlify";

        public string Help => "First create a personal access token at <a target='_blank' href='https://app.netlify.com/user/applications'>https://app.netlify.com/user/applications</a>. <br/> Then go to the site settings for your site, and in Site details/Site information you should see an API ID.";

        public IEnumerable<string> Fields => new[]
        {
            "PersonalAccessToken",
            "SiteId"
        };
    }
}