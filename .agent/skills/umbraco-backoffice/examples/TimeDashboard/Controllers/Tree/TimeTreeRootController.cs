using System.Globalization;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TimeDashboard.Controllers.Tree.Models;
using Umbraco.Cms.Api.Common.ViewModels.Pagination;
using Umbraco.Extensions;

namespace TimeDashboard.Controllers.Tree
{
    [ApiVersion("1.0")]
    public class TimeTreeRootController : TimeTreeControllerBase
    {
        [HttpGet("root")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType<PagedViewModel<TimeTreeItemResponseModel>>(StatusCodes.Status200OK)]
        public async Task<ActionResult<PagedViewModel<TimeTreeItemResponseModel>>> GetRoot(
            int skip = 0,
            int take = 100)
        {
            var items = GetTreeItems().ToList();
            return Ok(PagedViewModel(items, items.Count));
        }

        private static readonly string[] _cultures = ["en-US", "fr-fr", "en-GB"];

        private IEnumerable<TimeTreeItemResponseModel> GetTreeItems()
        {
            foreach (var culture in _cultures)
            {
                var cultureInfo = CultureInfo.GetCultureInfo(culture);
                yield return new TimeTreeItemResponseModel
                {
                    Id = cultureInfo.Name.ToGuid(),
                    HasChildren = false,
                    Name = cultureInfo.Name,
                };
            }
        }
    }
}
