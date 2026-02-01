using System;
using System.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using XStatic.Core.App;
using XStatic.Utilities;

namespace XStatic.Security
{
    public class AddXStaticRolesNotificationHandler(IRuntimeState runtimeState,
        IOptions<XStaticGlobalSettings> xStaticSettings,
        IUserService userService,
        IUserGroupService userGroupService,
        IShortStringHelper shortStringHelper,
        ILogger<AddXStaticRolesNotificationHandler> logger) : INotificationAsyncHandler<UmbracoApplicationStartedNotification>
    {
        private readonly IRuntimeState _runtimeState = runtimeState;
        private readonly IOptions<XStaticGlobalSettings> _xStaticSettings = xStaticSettings;
        private readonly IUserService _userService = userService;
        private readonly IUserGroupService _userGroupService = userGroupService;
        private readonly IShortStringHelper _shortStringHelper = shortStringHelper;
        private readonly ILogger<AddXStaticRolesNotificationHandler> _logger = logger;

        public async Task HandleAsync(UmbracoApplicationStartedNotification notification, CancellationToken cancellationToken)
        {
            
            if (_runtimeState.Level >= RuntimeLevel.Run)
            {
                var settings = _xStaticSettings?.Value;
                if (settings == null)
                {
                    _logger.LogInformation("xStatic - xStatic settings not configured, can't use Secure Roles mode.");
                    return;
                }

                var useXStaticUserRoles = settings.UseXStaticUserRoles;
                var hasUserToCreateRoles = settings.RoleCreationUseRootUser || !string.IsNullOrEmpty(settings?.RoleCreationUser);

                if (useXStaticUserRoles != true || !hasUserToCreateRoles)
                {
                    _logger.LogWarning("xStatic - xStatic user roles are not enabled or role creation user is not set. Skipping xStatic role creation.");
                    return;
                }

                var adminUser = settings.RoleCreationUseRootUser 
                    ? _userService.GetUserById(-1) 
                    : _userService.GetByUsername(settings.RoleCreationUser);

                if (adminUser == null)
                {
                    _logger.LogWarning("xStatic - Role creation user not found. Skipping xStatic role creation.");
                    return;
                }

                await CreateUserGroupIfNotExisting(XStaticRoles.XStaticAdminGroup, adminUser);
                await CreateUserGroupIfNotExisting(XStaticRoles.XStaticNormalUserGroup, adminUser);
            }
        }

        private async Task CreateUserGroupIfNotExisting(string alias, IUser adminUser)
        {
            await DatabaseRetryHelper.ExecuteWithRetryAsync(async () =>
            {
                var userGroup = await _userGroupService.GetAsync(alias);

                if (userGroup == null)
                {
                    UserGroup newUserGroup = CreateUserGroupModel(alias);
                    var attempt = await _userGroupService.CreateAsync(newUserGroup, adminUser.Key);

                    if (attempt.Success)
                    {
                        _logger.LogInformation("xStatic - Created user group {alias}.", alias);
                        userGroup = attempt.Result;
                    }
                    else
                    {
                        _logger.LogError(attempt.Exception, "xStatic - Failed to create user group {alias}.", alias);
                        // If creation failed, we can't proceed. Throwing might trigger retry, or we just fail.
                        // Assuming transient failure would be caught by global try/catch if exception thrown,
                        // but CreateAsync uses OperationResult.
                        // If we want to retry on failure, we probably need to throw only if it's a lock.
                        return;
                    }
                }
                else
                {
                    _logger.LogInformation("xStatic - User group {alias} exists.", alias);
                }

                // Ensure xStatic section permission
                if (!userGroup.AllowedSections.Contains("xStatic.Section"))
                {
                    userGroup.AddAllowedSection("xStatic.Section");
                    var updateAttempt = await _userGroupService.UpdateAsync(userGroup, adminUser.Key);
                    
                    if (!updateAttempt.Success)
                    {
                        _logger.LogError(updateAttempt.Exception, "xStatic - Failed to update user group {alias} with section.", alias);
                        return;
                    }
                }

                // Ensure User is in group
                await AddUserToCreatedGroup(alias, adminUser, userGroup);

            }, _logger, $"Create/Update User Group {alias}");
        }

        private UserGroup CreateUserGroupModel(string alias)
        {
            return new UserGroup(_shortStringHelper)
            {
                Alias = alias,
                Name = alias,
                Icon = "icon-os-x",
                Permissions = new HashSet<string> { alias }
            };
        }

        private async Task AddUserToCreatedGroup(string alias, IUser adminUser, IUserGroup group)
        {
            _logger.LogInformation("xStatic - Added xstatic section to user group {alias}.", alias);

            var userAttempted = await _userGroupService.AddUsersToUserGroupAsync(new Umbraco.Cms.Core.Models.UsersToUserGroupManipulationModel(group.Key, [adminUser.Key]), adminUser.Key);

            if (userAttempted.Success)
            {
                _logger.LogInformation("xStatic - Added user to user group {alias}.", alias);
            }
            else
            {
                _logger.LogError(userAttempted.Exception, "xStatic - Failed to add user to user group {alias}.", alias);
            }
        }
    }
}