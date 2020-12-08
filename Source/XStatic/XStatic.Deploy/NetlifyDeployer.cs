using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Deploy
{
    public class NetlifyDeployer : IDeployer
    {
        public const string DeployerKey = "netlify";
        private static string Api = "https://api.netlify.com/api/v1/";
        private readonly string _pat;
        private readonly string _appId;

        public NetlifyDeployer(Dictionary<string,string> parameters)
        {
            _pat = parameters["PersonalAccessToken"];
            _appId = parameters["SiteId"];
        }

        public async Task<DeployResult> DeployWholeSite(string folderPath)
        {
            var result = Deploy(_appId, folderPath);

            return new DeployResult
            {
                WasSuccessful = result
            };
        }

        public bool Deploy(string siteId, string folderPath)
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

            var json = JsonConvert.SerializeObject(new { files = hashes, draft = false });
            var client = new WebClient();
            //client.Credentials = new NetworkCredential(_access_token, "");
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
                return false;
            }

            var deployment = JsonConvert.DeserializeObject<Deployment>(response);
            foreach (var hash in deployment.required)
            {
                var fs = hashes.Where(e => e.Value == hash);
                foreach (var f in fs)
                {
                    var filePath = f.Key;
                    var fullPath = Path.Combine(folderPath, filePath.TrimStart('/').Replace('/', '\\'));
                    if (!File.Exists(fullPath))
                    {
                        continue;
                    }

                    var fileContent = File.ReadAllText(fullPath);
                    client.Headers.Add("Content-Type", "application/octet-stream");
                    try
                    {
                        client.UploadFile(Api + "deploys/" + deployment.id + "/files" + filePath, "PUT", fullPath);
                    }
                    catch (WebException ex)
                    {
                        client.Dispose();
                        return false;
                    }
                }
            }

            client.Dispose();
            return true;
        }
    }

    public class Deployment
    {
        public string id { get; set; }
        public string[] required { get; set; }
    }
}