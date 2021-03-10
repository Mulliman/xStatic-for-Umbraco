using Imagekit;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Library;

namespace XStatic.ImageKit
{
    public class ImageKitService
    {
        private readonly string _publicKey;
        private readonly string _privateKey;
        private readonly string _endpoint;
        private HashSet<string> _allFilePaths;

        public ImageKitService(string publicKey, string privateKey, string endpoint)
        {
            _publicKey = publicKey;
            _privateKey = privateKey;
            _endpoint = endpoint;
        }

        public async Task UploadFile(string f, string mediaFolderPath)
        {
            var imagekit = new ServerImagekit(_publicKey, _privateKey, _endpoint, "path");
            var relativePath = ("/" + FileHelpers.GetRelativePath(mediaFolderPath, f)).Replace("\\", "/");
            var fileName = Path.GetFileName(f);

            if (_allFilePaths == null)
            {
                await PopulateExistingIds();
            }

            if (_allFilePaths.Contains(relativePath))
            {
                return;
            }

            imagekit.FileName(fileName);
            imagekit.Folder(relativePath.Replace(fileName, string.Empty));
            imagekit.UseUniqueFileName(false);

            var response = await imagekit.UploadAsync(f);

            if (response.Exception)
            {
                throw new Exception(response.Message);
            }
        }

        private async Task PopulateExistingIds()
        {
            var imagekitGetter = new ServerImagekit(_publicKey, _privateKey, _endpoint, "path");
            var allFiles = await imagekitGetter.ListFilesAsync();

            _allFilePaths = new HashSet<string>(allFiles.Select(f => f.FilePath));
        }
    }
}