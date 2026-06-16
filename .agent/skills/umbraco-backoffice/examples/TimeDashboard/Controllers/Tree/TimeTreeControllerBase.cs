using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Cms.Web.Common.Routing;

namespace TimeDashboard.Controllers.Tree
{
    [ApiController]
    [BackOfficeRoute($"{Constants.ApiName}/api/v{{version:apiVersion}}/tree")]
    [ApiExplorerSettings(GroupName = Constants.ApiName)]
    [Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
    [MapToApi(Constants.ApiName)]
    public class TimeTreeControllerBase : ControllerBase
    {
        protected PagedViewModel<TItem> PagedViewModel<TItem>(IEnumerable<TItem> items, long totalItems)
            => new() { Items = items, Total = totalItems };
    }
}
