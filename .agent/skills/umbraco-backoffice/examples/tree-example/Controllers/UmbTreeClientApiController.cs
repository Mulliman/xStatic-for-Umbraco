using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace UmbTreeClient.Controllers
{
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = "UmbTreeClient")]
    public class UmbTreeClientApiController : UmbTreeClientApiControllerBase
    {

        [HttpGet("ping")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        public string Ping() => "Pong";
    }
}
