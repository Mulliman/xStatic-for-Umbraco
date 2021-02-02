using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using XStatic.Library;

namespace XStatic.Deploy
{
    public class NetlifyDeployer : IDeployer
    {
        public const string DeployerKey = "netlify";
        private static string Api = "https://api.netlify.com/api/v1/";
        private readonly string _pat;
        private readonly string _appId;

        public NetlifyDeployer(Dictionary<string, string> parameters)
        {
            _pat = parameters["PersonalAccessToken"];
            _appId = parameters["SiteId"];
        }

        public virtual async Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            return Deploy(_appId, folderPath);
        }

        public virtual XStaticResult Deploy(string siteId, string folderPath)
        {
            Deployment deployment;

            var hashes = GetHashes(siteId, folderPath);

            try
            {
                deployment = CheckNetlifyForRequiredChanges(siteId, folderPath, hashes);
            }
            catch (WebException we)
            {
                return XStaticResult.Error("Error uploding file hashes to Netlify. The deployment was not completed.", we);
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error parsing Netlify response. The deployment was not completed.", e);
            }

            var client = new WebClient();
            client.Headers.Add("Authorization", "Bearer " + _pat);

            foreach (var hash in deployment.required)
            {
                var toUpload = hashes.Where(e => e.Value == hash);
                foreach (var fileHashToUpload in toUpload)
                {
                    try
                    {
                        UploadFileToNetlify(fileHashToUpload, folderPath, client, deployment);
                    }
                    catch (WebException ex)
                    {
                        client.Dispose();
                        return XStaticResult.Error($"Error uploding file {fileHashToUpload.Key} to Netlify. The deployment was not completed.", ex);
                    }
                }
            }

            client.Dispose();
            return XStaticResult.Success("Site was successfully deployed to Netlify.");
        }

        protected virtual Dictionary<string, string> GetHashes(string siteId, string folderPath)
        {
            var files = Directory.EnumerateFiles(folderPath, "*.*", SearchOption.AllDirectories);
            var hashes = new Dictionary<string, string>();
            foreach (var f in files)
            {
                if (!File.Exists(f))
                {
                    continue;
                }

                using (var s = File.OpenRead(f))
                {
                    using (var cryptoProvider = new SHA1CryptoServiceProvider())
                    {
                        var hash = BitConverter.ToString(cryptoProvider.ComputeHash(s));
                        var file = f.Replace(folderPath, String.Empty);
                        hashes.Add(file.Replace('\\', '/'), hash.Replace("-", String.Empty).ToLowerInvariant());
                    }
                }
            }

            return hashes;
        }

        protected virtual Deployment CheckNetlifyForRequiredChanges(string siteId, string folderPath, Dictionary<string, string> hashes)
        {
            var json = JsonConvert.SerializeObject(new { files = hashes, draft = false });
            var client = new WebClient();

            client.Headers.Add("Authorization", "Bearer " + _pat);
            client.Headers.Add("Content-Type", "application/json");
            string response;

            try
            {
                response = client.UploadString(Api + "sites/" + siteId + "/deploys", "POST", json);
            }
            catch (WebException ex)
            {
                client.Dispose();
                throw;
            }

            var deployment = JsonConvert.DeserializeObject<Deployment>(response);

            return deployment;
        }

        protected void UploadFileToNetlify(KeyValuePair<string, string> fileHashToUpload, string folderPath, WebClient client, Deployment deployment)
        {
            var filePath = fileHashToUpload.Key;
            var fullPath = Path.Combine(folderPath, filePath.TrimStart('/').Replace('/', '\\'));
            if (!File.Exists(fullPath))
            {
                return;
            }

            client.Headers.Add("Content-Type", "application/octet-stream");

            client.UploadFile(Api + "deploys/" + deployment.id + "/files" + filePath, "PUT", fullPath);
        }
    }

    public class Deployment
    {
        public string id { get; set; }
        public string[] required { get; set; }
    }
}