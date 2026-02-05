using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Threading.Tasks;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator.Storage
{
    public class AppDataSiteStorer : IStaticSiteStorer
    {
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly ILogger<IStaticSiteStorer> _logger;
        private readonly string _xStaticPublishRoot;

        public AppDataSiteStorer(IWebHostEnvironment hostingEnvironment, ILogger<IStaticSiteStorer> logger)
        {
            _hostingEnvironment = hostingEnvironment;
            _logger = logger;

            var xStaticRoot = Path.Combine(new string[] { _hostingEnvironment.ContentRootPath, "umbraco", "Data", "xStatic" });
            _xStaticPublishRoot = Path.Combine(new string[] { _hostingEnvironment.ContentRootPath, "umbraco", "Data", "xStatic", "output" });

            if(!Directory.Exists(xStaticRoot)) Directory.CreateDirectory(xStaticRoot);
            if(!Directory.Exists(_xStaticPublishRoot)) Directory.CreateDirectory(_xStaticPublishRoot);
        }

        public async Task<string> StoreSiteItem(string subFolder, string path, string contents, System.Text.Encoding encoding)
        {
            string storagePath = FileHelpers.PathCombine(_xStaticPublishRoot, subFolder + "/" + path);
            var filePath = Path.Combine(_xStaticPublishRoot, storagePath);

            _logger.LogInformation("[StoreSiteItem] storagePath = {storagePath} | filePath = {filePath}", storagePath, filePath);

            var fi = new FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            await File.WriteAllTextAsync(storagePath, contents, encoding);

            _logger.LogInformation("[StoreSiteItem] File.WriteAllText is successful!");

            return filePath;
        }

        public Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath)
        {
            return TaskHelper.FromResultOf(() =>
            {
                var filePath = GetFileDestinationPath(subFolder, partialDestinationPath);

                _logger.LogInformation("[CopyFile] subFolder = {subFolder} | partialDestinationPath = {partialDestinationPath} | filePath = {filePath}", subFolder, partialDestinationPath, filePath);

                File.Copy(sourcePath, filePath);

                _logger.LogInformation("[CopyFile] File.Copy is successful!");

                return filePath;
            });
        }

        public Task<string> MoveFile(string subFolder, string sourcePath, string partialDestinationPath)
        {
            return TaskHelper.FromResultOf(() =>
            {
                var filePath = GetFileDestinationPath(subFolder, partialDestinationPath);

                File.Move(sourcePath, filePath);

                return filePath;
            });
        }

        public Task DeleteFile(string sourcePath)
        {
            return TaskHelper.FromResultOf(() =>
            {
                File.Delete(sourcePath);
            });
        }

        public async Task<string> SaveFile(string subFolder, Stream stream, string partialDestinationPath)
        {
            var filePath = GetFileDestinationPath(subFolder, partialDestinationPath);

            using (var fileStream = File.Create(filePath))
            {
                if (stream.CanSeek)
                {
                    stream.Seek(0, SeekOrigin.Begin);
                }
                await stream.CopyToAsync(fileStream);
            }

            return filePath;
        }

        public string GetFileDestinationPath(string subFolder, string partialDestinationPath)
        {
            string storagePath = FileHelpers.PathCombine(_xStaticPublishRoot, subFolder + "/" + partialDestinationPath);
            var filePath = Path.Combine(_xStaticPublishRoot, storagePath);

            var fi = new FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            return filePath;
        }

        public string GetStorageLocationOfSite(int staticSiteId)
        {
            string storagePath = FileHelpers.PathCombine(_xStaticPublishRoot, staticSiteId.ToString());            
            var folderPath = Path.Combine(_xStaticPublishRoot, storagePath);

            _logger.LogInformation("[GetStorageLocationOfSite] storagePath = {storagePath} | folderPath = {folderPath}", storagePath, folderPath);

            return folderPath;
        }
    }
}