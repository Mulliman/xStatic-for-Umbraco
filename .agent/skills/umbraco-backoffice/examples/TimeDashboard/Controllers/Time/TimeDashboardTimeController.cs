using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace TimeDashboard.Controllers.Time
{
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = Constants.ApiName)]
    public class TimeDashboardTimeController : TimeDashboardApiControllerBase
    {
        [HttpGet("time")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        public string GetTime() => DateTime.Now.ToString("T");

        [HttpGet("date")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        public string GetDate() => DateTime.Now.ToString("D");
    }
}
