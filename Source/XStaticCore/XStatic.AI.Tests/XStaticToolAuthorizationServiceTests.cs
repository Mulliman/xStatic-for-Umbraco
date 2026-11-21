using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using OpenIddict.Validation.AspNetCore;
using Umbraco.Cms.Core;
using XStatic.AI.Configuration;
using XStatic.AI.Security;
using XStatic.Core.App;
using XStatic.Security;
using Xunit;

namespace XStatic.AI.Tests;

public class XStaticToolAuthorizationServiceTests
{
    [Fact]
    public void Authorize_DeniesUnauthenticatedUser_WhenAuthorizationRequired()
    {
        var service = CreateService(useXStaticRoles: true, requireAuth: true, user: new ClaimsPrincipal(new ClaimsIdentity()));

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.False(result.IsAuthorized);
        Assert.Contains("authentication", result.DenialReason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Authorize_DeniesWhenHttpContextIsNull_AndAuthorizationRequired()
    {
        var service = CreateService(useXStaticRoles: true, requireAuth: true, user: null);

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.False(result.IsAuthorized);
    }

    [Fact]
    public void Authorize_DeniesFrontendMemberEvenWithXStaticAdminRole()
    {
        var member = CreateUser("member@example.com", authType: "UmbracoMembers", XStaticRoles.XStaticAdminGroup);
        var service = CreateService(useXStaticRoles: true, requireAuth: true, user: member);

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.False(result.IsAuthorized);
        Assert.Contains("backoffice", result.DenialReason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Authorize_DeniesFrontendMember_WhenUseXStaticUserRolesDisabled()
    {
        var member = CreateUser("member@example.com", authType: "UmbracoMembers");
        var service = CreateService(useXStaticRoles: false, requireAuth: true, user: member);

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.False(result.IsAuthorized);
        Assert.Contains("backoffice", result.DenialReason, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData(XStaticRoles.XStaticNormalUserGroup, Constants.Security.BackOfficeAuthenticationType)]
    [InlineData(XStaticRoles.XStaticAdminGroup, Constants.Security.BackOfficeAuthenticationType)]
    [InlineData(XStaticRoles.XStaticNormalUserGroup, OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
    public void Authorize_AllowsBackOfficeNormalAndAdminRoles_ForNormalUserAccess(string role, string authType)
    {
        var user = CreateUser("editor@example.com", authType, role);
        var service = CreateService(useXStaticRoles: true, requireAuth: true, user: user);

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.True(result.IsAuthorized);
        Assert.Null(result.DenialReason);
    }

    [Fact]
    public void Authorize_DeniesBackOfficeUserWithoutXStaticRole_WhenUseXStaticUserRolesEnabled()
    {
        var user = CreateUser("editor@example.com", Constants.Security.BackOfficeAuthenticationType, "writer");
        var service = CreateService(useXStaticRoles: true, requireAuth: true, user: user);

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.False(result.IsAuthorized);
        Assert.Contains(XStaticRoles.XStaticNormalUserGroup, result.DenialReason);
    }

    [Fact]
    public void Authorize_DeniesNormalUser_ForAdminAccessLevel()
    {
        var user = CreateUser("editor@example.com", Constants.Security.BackOfficeAuthenticationType, XStaticRoles.XStaticNormalUserGroup);
        var service = CreateService(useXStaticRoles: true, requireAuth: true, user: user);

        var result = service.Authorize(XStaticToolAccessLevel.Admin);

        Assert.False(result.IsAuthorized);
        Assert.Contains(XStaticRoles.XStaticAdminGroup, result.DenialReason);
    }

    [Fact]
    public void Authorize_AllowsBackOfficeUserWithoutXStaticRole_WhenUseXStaticUserRolesDisabled()
    {
        var user = CreateUser("editor@example.com", Constants.Security.BackOfficeAuthenticationType, "writer");
        var service = CreateService(useXStaticRoles: false, requireAuth: true, user: user);

        var result = service.Authorize(XStaticToolAccessLevel.NormalUser);

        Assert.True(result.IsAuthorized);
    }

    [Fact]
    public void Authorize_AllowsUnauthenticated_WhenRequireUserRoleAuthorizationDisabled()
    {
        var service = CreateService(useXStaticRoles: true, requireAuth: false, user: null);

        var result = service.Authorize(XStaticToolAccessLevel.Admin);

        Assert.True(result.IsAuthorized);
    }

    private static XStaticToolAuthorizationService CreateService(
        bool useXStaticRoles,
        bool requireAuth,
        ClaimsPrincipal? user)
    {
        var httpContextAccessor = new HttpContextAccessor
        {
            HttpContext = user is null ? null : new DefaultHttpContext { User = user }
        };

        return new XStaticToolAuthorizationService(
            Options.Create(new XStaticGlobalSettings { UseXStaticUserRoles = useXStaticRoles }),
            Options.Create(new XStaticAIOptions { RequireUserRoleAuthorization = requireAuth }),
            httpContextAccessor);
    }

    private static ClaimsPrincipal CreateUser(string name, string authType, params string[] roles)
    {
        var claims = new List<Claim> { new(ClaimTypes.Name, name) };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
        return new ClaimsPrincipal(new ClaimsIdentity(claims, authenticationType: authType));
    }
}
