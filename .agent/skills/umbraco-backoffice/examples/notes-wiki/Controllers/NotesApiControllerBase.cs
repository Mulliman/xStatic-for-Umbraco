using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Routing;

namespace NotesWiki.Controllers;

/// <summary>
/// Base controller for Notes Wiki API endpoints.
/// Configures routing, authorization, and Swagger grouping.
/// </summary>
[ApiController]
[BackOfficeRoute("notes/api/v{version:apiVersion}")]
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
[MapToApi(Constants.ApiName)]
public class NotesApiControllerBase : ControllerBase
{
}
