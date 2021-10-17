using System.IO;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Hosting;

namespace XStatic.Core.Generator.Storage
{
    public class AppDataSiteStorer : IStaticSiteStorer
    {
        private readonly IHostingEnvironment _hostingEnvironment;

        public AppDataSiteStorer(IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        public async Task<string> StoreSiteItem(string subFolder, string path, string contents, System.Text.Encoding encoding)
        {
            string storagePath = _hostingEnvironment.MapPathContentRoot("/App_Data/xStatic/output/" + subFolder + "/" + path);
            string root = _hostingEnvironment.MapPathContentRoot("~/");
            var filePath = Path.Combine(root, storagePath);

            var fi = new FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            File.WriteAllText(storagePath, contents, encoding);

            return filePath;
        }

        public async Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath)
        {
            var filePath = GetFileDestinationPath(subFolder, partialDestinationPath);

            File.Copy(sourcePath, filePath);

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
            string storagePath = _hostingEnvironment.MapPathContentRoot("/App_Data/xStatic/output/" + subFolder + "/" + partialDestinationPath);
            string root = _hostingEnvironment.MapPathContentRoot("~/");
            var filePath = Path.Combine(root, storagePath);

            var fi = new FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            return filePath;
        }

        public string GetStorageLocationOfSite(int staticSiteId)
        {
            string storagePath = _hostingEnvironment.MapPathContentRoot("/App_Data/xStatic/output/" + staticSiteId.ToString());
            string root = _hostingEnvironment.MapPathContentRoot("~/");
            var folderPath = Path.Combine(root, storagePath);

            return folderPath;
        }
    }
}