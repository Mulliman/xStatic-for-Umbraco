using System;
using System.Collections.Generic;
using System.IO;
using System.Web.Http;
using System.Web.UI;
using Umbraco.Core.Composing;
using Umbraco.Web.Editors;
using Umbraco.Web.Mvc;
using XStatic.Generator.Storage;
using XStatic.Plugin.Repositories;

namespace XStatic.Plugin.Controllers
{
    [PluginController("xstatic")]
    public class SitesController : UmbracoAuthorizedJsonController
    {
        private readonly IStaticSiteStorer _storer;
        private SitesRepository _sitesRepo;

        public SitesController(IStaticSiteStorer storer)
        {
            _sitesRepo = new SitesRepository();
            _storer = storer;
        }

        [HttpGet]
        public IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            var sites = _sitesRepo.GetAll();

            foreach(var site in sites)
            {
                var node = Umbraco.Content(site.RootNode);

                site.RootPath = node.Parent == null ? node.Name : node.Parent.Name + "/" + node.Name;

                var folder = _storer.GetStorageLocationOfSite(site.Id);
                var size = GetDirectorySize(new DirectoryInfo(folder));

                site.FolderSize = BytesToString(size);
            }

            return sites;
        }

        [HttpDelete]
        public IEnumerable<ExtendedGeneratedSite> ClearStoredSite(int staticSiteId)
        {
            var folder = _storer.GetStorageLocationOfSite(staticSiteId);

            if(Directory.Exists(folder))
            {
                Directory.Delete(folder, true);
            }
            
            return GetAll();
        }

        public static long GetDirectorySize(System.IO.DirectoryInfo directoryInfo, bool recursive = true)
        {
            var startDirectorySize = default(long);
            if (directoryInfo == null || !directoryInfo.Exists)
                return startDirectorySize; //Return 0 while Directory does not exist.

            //Add size of files in the Current Directory to main size.
            foreach (var fileInfo in directoryInfo.GetFiles())
                System.Threading.Interlocked.Add(ref startDirectorySize, fileInfo.Length);

            if (recursive) //Loop on Sub Direcotries in the Current Directory and Calculate it's files size.
                System.Threading.Tasks.Parallel.ForEach(directoryInfo.GetDirectories(), (subDirectory) =>
            System.Threading.Interlocked.Add(ref startDirectorySize, GetDirectorySize(subDirectory, recursive)));

            return startDirectorySize;  //Return full Size of this Directory.
        }

        private static string BytesToString(long byteCount)
        {
            string[] suf = { "B", "KB", "MB", "GB", "TB", "PB", "EB" };
            if (byteCount == 0)
                return "0" + suf[0];
            long bytes = Math.Abs(byteCount);
            int place = Convert.ToInt32(Math.Floor(Math.Log(bytes, 1024)));
            double num = Math.Round(bytes / Math.Pow(1024, place), 1);
            return (Math.Sign(byteCount) * num).ToString() + suf[place];
        }
    }

    public class ExtendedGeneratedSite : GeneratedSite
    {
        public string RootPath { get; set; }

        public string FolderSize { get; set; }
    }
}
