using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.IO.Compression;
using Umbraco.Cms.Api.Common.Attributes;
using Umbraco.Cms.Api.Common.Filters;
using Umbraco.Cms.Api.Management.Controllers;
using Umbraco.Cms.Core;
using Umbraco.Cms.Web.Common.Authorization;
using XStatic.Controllers.Attributes;
using XStatic.Core;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.Controllers
{
    [ApiController]
    [ApiVersion("1.0")]
    [MapToApi("xstatic-v1")]
    [AuthorizeNormalUser]
    [JsonOptionsName(Constants.JsonOptionsNames.BackOffice)]
    [Route("api/v{version:apiVersion}/xstatic/download")]
    public class DownloadController(IStaticSiteStorer storer, ISitesRepository sitesRepo) : ManagementApiControllerBase
    {
        private readonly IStaticSiteStorer _storer = storer;
        private readonly ISitesRepository _sitesRepo = sitesRepo;

        [HttpGet("download-site")]
        [MapToApiVersion("1.0")]
        [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
        public FileStreamResult DownloadStaticSite(int staticSiteId)
        {
            var entity = _sitesRepo.Get<SiteConfig>(staticSiteId);

            if (entity == null)
            {
                throw new XStaticException("Site not found with id " + staticSiteId);
            }

            var localFolderPath = _storer.GetStorageLocationOfSite(entity.Id);

            if (!Directory.Exists(localFolderPath))
            {
                throw new FileNotFoundException();
            }

            var localZipFilePath = localFolderPath.TrimEnd(new char[]  { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar }) + ".zip";

            if (System.IO.File.Exists(localZipFilePath))
            {
                System.IO.File.Delete(localZipFilePath);
            }

            ZipFile.CreateFromDirectory(localFolderPath, localZipFilePath);

            var fileName = $"xStatic site download {staticSiteId}.zip";
            var mimeType = "application/zip";
            Stream stream = new FileStream(localZipFilePath, FileMode.Open, FileAccess.Read);

            return new FileStreamResult(stream, mimeType)
            {
                FileDownloadName = fileName
            };
        }
    }
}