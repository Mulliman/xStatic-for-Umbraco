using NetlifySharp;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Models;

namespace XStatic.Netlify
{
    public class NetlifyDeploymentTargetCreator(Dictionary<string, string> parameters) : IDeploymentTargetCreator
    {
        private readonly Dictionary<string, string> _parameters = parameters;

        public async Task<DeploymentTargetUpdateModel> CreateTarget()
        {
            string personalAccessToken = _parameters[NetlifyDeploymentTargetCreatorDefinition.FieldNames.PAT];
            string siteName = _parameters[NetlifyDeploymentTargetCreatorDefinition.FieldNames.SiteName];

            if(string.IsNullOrWhiteSpace(personalAccessToken))
            {
                throw new Exception("Personal Access Token is required.");
            }

            if(string.IsNullOrWhiteSpace(siteName))
            {
                throw new Exception("Site Name is required.");
            }
                
            var client = new NetlifyClient(personalAccessToken);

            var site = new SiteSetup(client)
            {
                Name = siteName
            };


            Site createdSite;

            try
            {
                createdSite = await client.CreateSiteAsync(site, false);
            }
            catch
            {
                throw new XStaticException("Error creating site on Netlify, please make sure that the site name is unique and try again.");
            }

            var target = new DeploymentTargetUpdateModel
            {
                Name = siteName,
                DeployerDefinition = new NetlifyDeployerDefinition().Id,
                Fields = new Dictionary<string, string>
                {
                    { NetlifyDeployerDefinition.FieldNames.PAT, personalAccessToken },
                    { NetlifyDeployerDefinition.FieldNames.SiteId, createdSite.Id }
                }
            };

            return target;
        }
    }

    public class NetlifyDeploymentTargetCreatorDefinition : IDeploymentTargetCreatorDefinition
    {
        public class FieldNames
        {
            public const string PAT = "NetlifyCreator.PAT";
            public const string SiteName = "NetlifyCreator.SiteName";
        }

        public string Id { get; } = "netlify-site-creator";

        public string Name { get; } = "Netlify Site Creator";

        public string Help { get; } = "Create a new Netlify website without having to go to the Netlify site. Fill in the fields and the site will be created and a new Deployment Target will be configured in xStatic. You will need a valid Personal Access Token to enable this; if you don't have one configured go to <a href='https://app.netlify.com/user/applications#content' target='_blank'>app.netlify.com/user/applications</a>. You should test your site name before creating, as it will fail if it already exists.";

        public IEnumerable<DeployerField> Fields => new[]
        {
                new DeployerField { Alias=FieldNames.PAT, Name = "Personal Access Token", EditorUiAlias = UIEditors.Password },
                new DeployerField { Alias=FieldNames.SiteName, Name = "Site Name", EditorUiAlias = "xstatic.propertyEditorUi.netlifySubdomain" },
            };
    }
}
