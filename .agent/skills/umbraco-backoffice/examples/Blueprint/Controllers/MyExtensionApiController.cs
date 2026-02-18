using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


namespace MyExtension.Controllers
{
    [ApiVersion("1.0")]
    [ApiExplorerSettings(GroupName = "MyExtension")]
    public class MyExtensionApiController : MyExtensionApiControllerBase
    {

        [HttpGet("ping")]
        [ProducesResponseType<string>(StatusCodes.Status200OK)]
        public string Ping() => "Pong";

    }
}
