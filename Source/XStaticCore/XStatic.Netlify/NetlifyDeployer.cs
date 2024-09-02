using NetlifySharp;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;

namespace XStatic.Netlify
{
    public class NetlifyDeployer(Dictionary<string, string> parameters) : IDeployer
    {
        public const string DeployerKey = "netlify";
        private readonly string _pat = parameters[NetlifyDeployerDefinition.FieldNames.PAT];
        private readonly string _appId = parameters[NetlifyDeployerDefinition.FieldNames.SiteId];

        public async virtual Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            return await Deploy(_appId, folderPath);
        }

        public async virtual Task<XStaticResult> Deploy(string siteId, string folderPath)
        {
            Deploy deployment;
            var netlifyClient = new NetlifyClient(_pat);

            var hashes = GetHashes(siteId, folderPath);

            try
            {
                deployment = await CheckNetlifyForRequiredChanges(netlifyClient, siteId, folderPath, hashes);
            }
            catch (WebException we)
            {
                return XStaticResult.Error("Error uploding file hashes to Netlify. The deployment was not completed.", we);
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error parsing Netlify response. The deployment was not completed.", e);
            }

            foreach (var hash in deployment.Required)
            {
                var toUpload = hashes.Where(e => e.Value == hash);
                foreach (var fileHashToUpload in toUpload)
                {
                    try
                    {
                        await UploadFileToNetlify(fileHashToUpload, folderPath, netlifyClient, deployment);
                    }
                    catch (Exception ex)
                    {
                        return XStaticResult.Error($"Error uploding file {fileHashToUpload.Key} to Netlify. The deployment was not completed.", ex);
                    }
                }
            }

            return XStaticResult.Success("Site was successfully deployed to Netlify.");
        }

        protected virtual Dictionary<string, string> GetHashes(string siteId, string folderPath)
        {
            var files = Directory.EnumerateFiles(folderPath, "*.*", SearchOption.AllDirectories);
            var hashes = new Dictionary<string, string>();
            foreach (var f in files)
            {
                if (!System.IO.File.Exists(f))
                {
                    continue;
                }

                using var s = System.IO.File.OpenRead(f);
                using var cryptoProvider = SHA1.Create();

                var hash = BitConverter.ToString(cryptoProvider.ComputeHash(s));
                var file = f.Replace(folderPath, string.Empty);
                hashes.Add(file.Replace('\\', '/'), hash.Replace("-", String.Empty).ToLowerInvariant());
            }

            return hashes;
        }

        protected async virtual Task<Deploy> CheckNetlifyForRequiredChanges(NetlifyClient client, string siteId, string folderPath, Dictionary<string, string> hashes)
        {
            var files = new DeployFiles(client)
            {
                Files = hashes,
                Draft = false
            };

            var response = await client.CreateSiteDeployAsync("xStatic deploy " + DateTime.Now.ToString("u"), files, siteId);

            return response;
        }

        protected async virtual Task UploadFileToNetlify(KeyValuePair<string, string> fileHashToUpload, string folderPath, NetlifyClient client, Deploy deployment)
        {
            var filePath = fileHashToUpload.Key;
            var fullPath = Path.Combine(folderPath, filePath.TrimStart('/').Replace('/', '\\'));
            if (!System.IO.File.Exists(fullPath))
            {
                return;
            }

            using var stream = System.IO.File.OpenRead(fullPath);

            await client.UploadDeployFileAsync(deployment.Id, filePath, null, stream);
        }
    }
}