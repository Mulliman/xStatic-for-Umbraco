using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OpenIddict.Validation.AspNetCore;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using XStatic.Core.App;
using XStatic.Security;

namespace XStatic.Controllers.Attributes
{
    public class AuthorizeAdminPolicyOptions(IOptions<XStaticGlobalSettings> globalSettings) : IConfigureOptions<AuthorizationOptions>
    {
        private readonly IOptions<XStaticGlobalSettings> _globalSettings = globalSettings;

        public void Configure(AuthorizationOptions options)
        {
            options.AddPolicy(XStaticRoles.XStaticAdminGroup, policy =>
            {
                if (_globalSettings?.Value?.UseXStaticUserRoles == true)
                {
                    policy.RequireRole(XStaticRoles.XStaticAdminGroup);
                }

                policy.AuthenticationSchemes.Add(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
                policy.RequireAuthenticatedUser();
            });
        }
    }

    public class AuthorizeAdminPolicyComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.Services.ConfigureOptions<AuthorizeAdminPolicyOptions>();
    }

    public class AuthorizeAdminAttribute : AuthorizeAttribute
    {
        public AuthorizeAdminAttribute()
        {
            Policy = XStaticRoles.XStaticAdminGroup;
        }
    }
}