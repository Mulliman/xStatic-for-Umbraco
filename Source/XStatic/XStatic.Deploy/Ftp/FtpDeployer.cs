using FluentFTP;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Deploy.Ftp
{
    public class FtpDeployer : IDeployer
    {
        public const string DeployerKey = "ftp";
        private readonly string _hostname;
        private readonly int _port;
        private readonly string _username;
        private readonly string _password; 
        private readonly string _folder;

        public FtpDeployer(Dictionary<string, string> parameters)
        {
            _hostname = parameters["Hostname"];
            _username = parameters["Username"];
            _password = parameters["Password"];
            _folder = parameters["Folder"];

            _port = 21;
            int.TryParse(parameters["Port"], out _port);
        }

        public virtual async Task<DeployResult> DeployWholeSite(string folderPath)
        {
            var result = Deploy(folderPath);

            return new DeployResult
            {
                WasSuccessful = result
            };
        }

        public virtual bool Deploy(string folderPath)
        {
            try
            {
                FtpClient client = new FtpClient(_hostname, _port, _username, _password);
                client.EncryptionMode = FtpEncryptionMode.Auto;
                client.ValidateAnyCertificate = true;
                client.Connect();

                var remoteFolder = string.IsNullOrEmpty(_folder) ? "/" : _folder;

                client.UploadDirectory(folderPath, remoteFolder, FtpFolderSyncMode.Mirror);

                client.Dispose();
            }
            catch (Exception e)
            {
                return false;
            }
            
            return true;
        }
    }
}