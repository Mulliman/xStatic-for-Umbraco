using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OpenIddict.Validation.AspNetCore;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using XStatic.Core.App;
using XStatic.Security;

namespace XStatic.Controllers.Attributes
{
    public class AuthorizeNormalUserPolicyOptions(IOptions<XStaticGlobalSettings> globalSettings) : IConfigureOptions<AuthorizationOptions>
    {
        private readonly IOptions<XStaticGlobalSettings> _globalSettings = globalSettings;

        public void Configure(AuthorizationOptions options)
        {
            options.AddPolicy(XStaticRoles.XStaticNormalUserGroup, policy =>
            {
                if (_globalSettings?.Value?.UseXStaticUserRoles == true)
                {
                    policy.RequireRole(XStaticRoles.XStaticNormalUserGroup, XStaticRoles.XStaticAdminGroup);
                }

                // Umbraco 19 signs backoffice users in with a cookie. API users (client credentials, as used
                // by XStatic.RemoteOperations) still send OpenIddict bearer tokens. Accept both.
                policy.AuthenticationSchemes.Add(Constants.Security.BackOfficeAuthenticationType);
                policy.AuthenticationSchemes.Add(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
                policy.RequireAuthenticatedUser();
            });
        }
    }

    public class AuthorizeNormalUserPolicyComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.Services.ConfigureOptions<AuthorizeNormalUserPolicyOptions>();
    }

    public class AuthorizeNormalUserAttribute : AuthorizeAttribute
    {
        public AuthorizeNormalUserAttribute()
        {
            Policy = XStaticRoles.XStaticNormalUserGroup;
        }
    }
}