using Imagekit;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using XStatic.Deploy;
using XStatic.Library;

namespace XStatic.ImageKit
{
    public class NetlifyWithImageKitMediaDeployer : NetlifyDeployer
    {
        private readonly string _appId;
        private readonly string _imageKitPublicKey;
        private readonly string _imageKitPrivateKey;
        private readonly string _imageKitEndpoint;

        public NetlifyWithImageKitMediaDeployer(Dictionary<string, string> parameters) : base(parameters)
        {
            _appId = parameters["SiteId"];
            _imageKitPublicKey = parameters["ImageKitPublicKey"];
            _imageKitPrivateKey = parameters["ImageKitPrivateKey"];
            _imageKitEndpoint = parameters["ImageKitEndpoint"];
        }

        public override async Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            var netlifyResult = base.Deploy(_appId, folderPath);

            if(!netlifyResult.WasSuccessful)
            {
                return netlifyResult;
            }

            var mediaFolderPath = Path.Combine(folderPath, "media");

            var imagekitResult = await UploadMedia(mediaFolderPath);

            if (!imagekitResult.WasSuccessful)
            {
                return imagekitResult;
            }

            return XStaticResult.Success();
        }

        protected async Task<XStaticResult> UploadMedia(string mediaFolderPath)
        {
            var files = Directory.EnumerateFiles(mediaFolderPath, "*.*", SearchOption.AllDirectories);

            var imagekitGetter = new ServerImagekit(_imageKitPublicKey, _imageKitPrivateKey, _imageKitEndpoint, "path");
            var allFiles = await imagekitGetter.ListFilesAsync();

            var allFilePaths = new HashSet<string>(allFiles.Select(f => f.FilePath));

            foreach (var f in files)
            {
                if (!File.Exists(f))
                {
                    continue;
                }

                var imagekit = new ServerImagekit(_imageKitPublicKey, _imageKitPrivateKey, _imageKitEndpoint, "path");
                var relativePath = ("/" + FileHelpers.GetRelativePath(mediaFolderPath, f)).Replace("\\", "/");
                var fileName = Path.GetFileName(f);

                if (allFilePaths.Contains(relativePath))
                {
                    continue;
                }

                imagekit.FileName(fileName);
                imagekit.Folder(relativePath.Replace(fileName, string.Empty));
                imagekit.UseUniqueFileName(false);

                var response = await imagekit.UploadAsync(f);

                if(response.Exception)
                {
                    return XStaticResult.Error(response.Message);
                }
            }

            return XStaticResult.Success();
        }

        protected override Dictionary<string, string> GetHashes(string siteId, string folderPath)
        {
            var files = Directory.EnumerateFiles(folderPath, "*.*", SearchOption.AllDirectories);
            var hashes = new Dictionary<string, string>();
            foreach (var f in files)
            {
                if (!File.Exists(f))
                {
                    continue;
                }

                var file = f.Replace(folderPath, String.Empty);

                // Don't deploy media to netlify
                if (file.TrimStart(new [] {'/', '\\'}).StartsWith("media", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                using (var s = File.OpenRead(f))
                {
                    using (var cryptoProvider = new SHA1CryptoServiceProvider())
                    {
                        var hash = BitConverter.ToString(cryptoProvider.ComputeHash(s));
                        hashes.Add(file.Replace('\\', '/'), hash.Replace("-", String.Empty).ToLowerInvariant());
                    }
                }
            }

            return hashes;
        }
    }
}