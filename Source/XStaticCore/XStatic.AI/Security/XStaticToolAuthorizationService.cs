using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using OpenIddict.Validation.AspNetCore;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Security;
using XStatic.AI.Configuration;
using XStatic.Core.App;
using XStatic.Security;

namespace XStatic.AI.Security;

/// <summary>
/// Required xStatic access level for invoking an AI agent tool.
/// </summary>
public enum XStaticToolAccessLevel
{
    /// <summary>
    /// Allows members of <see cref="XStaticRoles.XStaticNormalUserGroup"/> or <see cref="XStaticRoles.XStaticAdminGroup"/>.
    /// </summary>
    NormalUser,

    /// <summary>
    /// Allows members of <see cref="XStaticRoles.XStaticAdminGroup"/> only.
    /// </summary>
    Admin
}

/// <summary>
/// Outcome of checking whether the current user is permitted to invoke an xStatic AI tool.
/// </summary>
public sealed record XStaticToolAuthorizationResult(bool IsAuthorized, string? DenialReason = null)
{
    public static XStaticToolAuthorizationResult Allowed() => new(true);

    public static XStaticToolAuthorizationResult Denied(string reason) => new(false, reason);
}

/// <summary>
/// Enforces Umbraco backoffice authentication and xStatic role-based authorization (<see cref="XStaticRoles"/>)
/// for AI agent tool calls.
/// </summary>
public interface IXStaticToolAuthorizationService
{
    XStaticToolAuthorizationResult Authorize(
        XStaticToolAccessLevel requiredAccess = XStaticToolAccessLevel.NormalUser,
        ClaimsPrincipal? user = null);
}

/// <summary>
/// Default implementation of <see cref="IXStaticToolAuthorizationService"/> that mirrors
/// xStatic's backoffice authorization policies (<see cref="XStaticGlobalSettings.UseXStaticUserRoles"/> and <see cref="XStaticRoles"/>)
/// while rejecting non-backoffice identities (such as front-end Umbraco Members).
/// </summary>
public class XStaticToolAuthorizationService : IXStaticToolAuthorizationService
{
    private static readonly HashSet<string> AllowedBackOfficeAuthTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        Constants.Security.BackOfficeAuthenticationType,
        OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme
    };

    private readonly IOptions<XStaticGlobalSettings> _globalSettings;
    private readonly IOptions<XStaticAIOptions> _aiOptions;
    private readonly IHttpContextAccessor? _httpContextAccessor;
    private readonly IBackOfficeSecurityAccessor? _backOfficeSecurityAccessor;

    public XStaticToolAuthorizationService(
        IOptions<XStaticGlobalSettings> globalSettings,
        IOptions<XStaticAIOptions> aiOptions,
        IHttpContextAccessor? httpContextAccessor = null,
        IBackOfficeSecurityAccessor? backOfficeSecurityAccessor = null)
    {
        _globalSettings = globalSettings ?? throw new ArgumentNullException(nameof(globalSettings));
        _aiOptions = aiOptions ?? throw new ArgumentNullException(nameof(aiOptions));
        _httpContextAccessor = httpContextAccessor;
        _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
    }

    public XStaticToolAuthorizationResult Authorize(
        XStaticToolAccessLevel requiredAccess = XStaticToolAccessLevel.NormalUser,
        ClaimsPrincipal? user = null)
    {
        if (!_aiOptions.Value.RequireUserRoleAuthorization)
        {
            return XStaticToolAuthorizationResult.Allowed();
        }

        // Prefer Umbraco's IBackOfficeSecurityAccessor when no explicit principal was passed
        if (user is null && _backOfficeSecurityAccessor?.BackOfficeSecurity?.CurrentUser is { } backOfficeUser)
        {
            if (!_globalSettings.Value.UseXStaticUserRoles)
            {
                return XStaticToolAuthorizationResult.Allowed();
            }

            var groupAliases = backOfficeUser.Groups
                .Select(g => g.Alias)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            return CheckRoles(groupAliases.Contains, requiredAccess);
        }

        var principal = user ?? _httpContextAccessor?.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return XStaticToolAuthorizationResult.Denied(
                "Backoffice authentication is required to execute xStatic tools.");
        }

        if (!IsBackOfficePrincipal(principal))
        {
            return XStaticToolAuthorizationResult.Denied(
                "Only authenticated Umbraco backoffice users may execute xStatic tools.");
        }

        if (!_globalSettings.Value.UseXStaticUserRoles)
        {
            return XStaticToolAuthorizationResult.Allowed();
        }

        return CheckRoles(principal.IsInRole, requiredAccess);
    }

    private static bool IsBackOfficePrincipal(ClaimsPrincipal principal)
    {
        return principal.Identities.Any(identity =>
            identity.IsAuthenticated
            && !string.IsNullOrWhiteSpace(identity.AuthenticationType)
            && AllowedBackOfficeAuthTypes.Contains(identity.AuthenticationType));
    }

    private static XStaticToolAuthorizationResult CheckRoles(
        Func<string, bool> hasRole,
        XStaticToolAccessLevel requiredAccess)
    {
        var isAdmin = hasRole(XStaticRoles.XStaticAdminGroup);
        if (requiredAccess == XStaticToolAccessLevel.Admin)
        {
            return isAdmin
                ? XStaticToolAuthorizationResult.Allowed()
                : XStaticToolAuthorizationResult.Denied(
                    $"User does not have the required '{XStaticRoles.XStaticAdminGroup}' role.");
        }

        var isNormalUser = hasRole(XStaticRoles.XStaticNormalUserGroup);
        return isAdmin || isNormalUser
            ? XStaticToolAuthorizationResult.Allowed()
            : XStaticToolAuthorizationResult.Denied(
                $"User must belong to '{XStaticRoles.XStaticNormalUserGroup}' or '{XStaticRoles.XStaticAdminGroup}'.");
    }
}
