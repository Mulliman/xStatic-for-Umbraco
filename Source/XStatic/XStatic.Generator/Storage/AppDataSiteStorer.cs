using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace XStatic.Generator.Storage
{
    public class AppDataSiteStorer : IStaticSiteStorer
    {
        public async Task<string> StoreSiteItem(string subFolder, string path, string contents, System.Text.Encoding encoding)
        {
            string storagePath = System.Web.Hosting.HostingEnvironment.MapPath("/App_Data/xStatic/output/" + subFolder + "/" + path);
            string root = System.Web.Hosting.HostingEnvironment.MapPath("~/");
            var filePath = Path.Combine(root, storagePath);

            var fi = new System.IO.FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            System.IO.File.WriteAllText(storagePath, contents, encoding);

            return filePath;
        }

        public async Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath)
        {
            var filePath = GetFileDestinationPath(subFolder, partialDestinationPath);

            System.IO.File.Copy(sourcePath, filePath);

            return filePath;
        }

        public async Task<string> SaveFile(string subFolder, Stream stream, string partialDestinationPath)
        {
            var filePath = GetFileDestinationPath(subFolder, partialDestinationPath);

            using (var fileStream = File.Create(filePath))
            {
                stream.Seek(0, SeekOrigin.Begin);
                stream.CopyTo(fileStream);
            }

            return filePath;
        }

        public string GetFileDestinationPath(string subFolder, string partialDestinationPath)
        {
            string storagePath = System.Web.Hosting.HostingEnvironment.MapPath("/App_Data/xStatic/output/" + subFolder + "/" + partialDestinationPath);
            string root = System.Web.Hosting.HostingEnvironment.MapPath("~/");
            var filePath = Path.Combine(root, storagePath);

            var fi = new System.IO.FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            return filePath;
        }

        public string GetStorageLocationOfSite(int staticSiteId)
        {
            string storagePath = System.Web.Hosting.HostingEnvironment.MapPath("/App_Data/xStatic/output/" + staticSiteId.ToString());
            string root = System.Web.Hosting.HostingEnvironment.MapPath("~/");
            var folderPath = Path.Combine(root, storagePath);

            return folderPath;
        }
    }
}