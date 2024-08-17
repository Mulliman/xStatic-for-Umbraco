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
    public class AuthorizeNormalUserPolicyComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.Services.AddAuthorization(options =>
                options.AddPolicy(XStaticRoles.XStaticNormalUserGroup, policy =>
                {
                    var settings = builder.Services.BuildServiceProvider().GetService<IOptions<XStaticGlobalSettings>>()?.Value;

                    if (settings?.UseXStaticUserRoles == true)
                    {
                        policy.RequireRole(XStaticRoles.XStaticNormalUserGroup, XStaticRoles.XStaticAdminGroup);
                    }

                    policy.AuthenticationSchemes.Add(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme);
                    policy.RequireAuthenticatedUser();
                })
            );
    }

    public class AuthorizeNormalUserAttribute : AuthorizeAttribute
    {
        public AuthorizeNormalUserAttribute()
        {
            Policy = XStaticRoles.XStaticNormalUserGroup;
        }
    }
}