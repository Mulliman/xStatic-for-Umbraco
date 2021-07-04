//using System;
//using System.Collections.Generic;
//using System.IO;
//using System.IO.Compression;
//using System.Linq;
//using System.Net;
//using System.Net.Http;
//using System.Net.Http.Headers;
//using System.Text;
//using System.Threading.Tasks;
//using System.Web;
//using System.Web.Http;
//using Umbraco.Web.Mvc;
//using Umbraco.Web.WebApi;
//using XStatic.Generator.Storage;
//using XStatic.Plugin.Repositories;

//namespace XStatic.Plugin.Controllers
//{
//    [PluginController("xstatic")]
//    public class DownloadController : UmbracoAuthorizedApiController
//    {
//        private readonly IStaticSiteStorer _storer;
//        private SitesRepository _sitesRepo;

//        public DownloadController(IStaticSiteStorer storer)
//        {
//            _storer = storer;
//            _sitesRepo = new SitesRepository();
//        }

//        [HttpGet]
//        public HttpResponseMessage DownloadStaticSite(int staticSiteId)
//        {
//            var entity = _sitesRepo.Get(staticSiteId);

//            if (entity == null)
//            {
//                throw new HttpException(404, "Site not found with id " + staticSiteId);
//            }

//            var localFolderPath = _storer.GetStorageLocationOfSite(entity.Id);

//            if (!Directory.Exists(localFolderPath))
//            {
//                throw new FileNotFoundException();
//            }

//            var localZipFilePath = localFolderPath.Trim('/').Trim('\\') + ".zip";

//            if (File.Exists(localZipFilePath))
//            {
//                File.Delete(localZipFilePath);
//            }

//            ZipFile.CreateFromDirectory(localFolderPath, localZipFilePath);

//            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK);
//            response.Content = new StreamContent(new FileStream(localZipFilePath, FileMode.Open, FileAccess.Read));
//            response.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment");
//            response.Content.Headers.ContentDisposition.FileName = $"{entity.Name}.{DateTime.Now.ToString("yyMMddHHmmss")}.zip";
//            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/zip");

//            return response;
//        }
//    }
//}