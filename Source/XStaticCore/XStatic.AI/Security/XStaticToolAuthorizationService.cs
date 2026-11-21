using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
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
/// Enforces xStatic role-based authorization (<see cref="XStaticRoles"/>) for AI agent tool calls.
/// </summary>
public interface IXStaticToolAuthorizationService
{
    XStaticToolAuthorizationResult Authorize(
        XStaticToolAccessLevel requiredAccess = XStaticToolAccessLevel.NormalUser,
        ClaimsPrincipal? user = null);
}

/// <summary>
/// Default implementation of <see cref="IXStaticToolAuthorizationService"/> that mirrors
/// xStatic's backoffice authorization policies (<see cref="XStaticGlobalSettings.UseXStaticUserRoles"/> and <see cref="XStaticRoles"/>).
/// </summary>
public class XStaticToolAuthorizationService : IXStaticToolAuthorizationService
{
    private readonly IOptions<XStaticGlobalSettings> _globalSettings;
    private readonly IOptions<XStaticAIOptions> _aiOptions;
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public XStaticToolAuthorizationService(
        IOptions<XStaticGlobalSettings> globalSettings,
        IOptions<XStaticAIOptions> aiOptions,
        IHttpContextAccessor? httpContextAccessor = null)
    {
        _globalSettings = globalSettings ?? throw new ArgumentNullException(nameof(globalSettings));
        _aiOptions = aiOptions ?? throw new ArgumentNullException(nameof(aiOptions));
        _httpContextAccessor = httpContextAccessor;
    }

    public XStaticToolAuthorizationResult Authorize(
        XStaticToolAccessLevel requiredAccess = XStaticToolAccessLevel.NormalUser,
        ClaimsPrincipal? user = null)
    {
        if (!_aiOptions.Value.RequireUserRoleAuthorization)
        {
            return XStaticToolAuthorizationResult.Allowed();
        }

        var principal = user ?? _httpContextAccessor?.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return XStaticToolAuthorizationResult.Denied(
                "Authentication is required to execute xStatic tools.");
        }

        if (!_globalSettings.Value.UseXStaticUserRoles)
        {
            return XStaticToolAuthorizationResult.Allowed();
        }

        var isAdmin = principal.IsInRole(XStaticRoles.XStaticAdminGroup);
        if (requiredAccess == XStaticToolAccessLevel.Admin)
        {
            return isAdmin
                ? XStaticToolAuthorizationResult.Allowed()
                : XStaticToolAuthorizationResult.Denied(
                    $"User does not have the required '{XStaticRoles.XStaticAdminGroup}' role.");
        }

        var isNormalUser = principal.IsInRole(XStaticRoles.XStaticNormalUserGroup);
        return isAdmin || isNormalUser
            ? XStaticToolAuthorizationResult.Allowed()
            : XStaticToolAuthorizationResult.Denied(
                $"User must belong to '{XStaticRoles.XStaticNormalUserGroup}' or '{XStaticRoles.XStaticAdminGroup}'.");
    }
}
