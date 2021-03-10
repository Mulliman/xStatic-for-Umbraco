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
        private readonly ImageKitService _imageKitService;

        public NetlifyWithImageKitMediaDeployer(Dictionary<string, string> parameters) : base(parameters)
        {
            _appId = parameters["SiteId"];
            _imageKitPublicKey = parameters["ImageKitPublicKey"];
            _imageKitPrivateKey = parameters["ImageKitPrivateKey"];
            _imageKitEndpoint = parameters["ImageKitEndpoint"];

            _imageKitService = new ImageKitService(_imageKitPublicKey, _imageKitPrivateKey, _imageKitEndpoint);
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

            foreach (var f in files.Where(f => File.Exists(f)))
            {
                try
                {
                    await _imageKitService.UploadFile(f, mediaFolderPath);
                }
                catch (Exception e)
                {
                    return XStaticResult.Error(e.Message);
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