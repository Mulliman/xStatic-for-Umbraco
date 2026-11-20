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
    public class AuthorizeAdminPolicyComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.Services.AddAuthorization(options =>
                options.AddPolicy(XStaticRoles.XStaticAdminGroup, policy =>
                {
                    var settings = builder.Services.BuildServiceProvider().GetService<IOptions<XStaticGlobalSettings>>()?.Value;

                    if (settings?.UseXStaticUserRoles == true)
                    {
                        policy.RequireRole(XStaticRoles.XStaticAdminGroup);
                    }

                    // Umbraco 19 signs backoffice users in with a cookie. API users (client credentials, as used
                    // by XStatic.RemoteOperations) still send OpenIddict bearer tokens. Accept both.
                    policy.AuthenticationSchemes.Add(Constants.Security.BackOfficeAuthenticationType);
                    policy.AuthenticationSchemes.Add(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                })
            );
    }

    public class AuthorizeAdminAttribute : AuthorizeAttribute
    {
        public AuthorizeAdminAttribute()
        {
            Policy = XStaticRoles.XStaticAdminGroup;
        }
    }
}