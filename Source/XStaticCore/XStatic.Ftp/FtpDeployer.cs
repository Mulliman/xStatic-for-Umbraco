using FluentFTP;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Helpers;
using XStatic.Core.Deploy;

namespace XStatic.Ftp
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
            _hostname = parameters[FtpDeployerDefinition.FieldNames.Hostname];
            _username = parameters[FtpDeployerDefinition.FieldNames.Username];
            _password = parameters[FtpDeployerDefinition.FieldNames.Password];
            _folder = parameters[FtpDeployerDefinition.FieldNames.Folder];

            _port = 21;
            int.TryParse(parameters[FtpDeployerDefinition.FieldNames.Port], out _port);
        }

        public virtual Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            return TaskHelper.FromResultOf(() =>
            {
                return Deploy(folderPath);
            });
        }

        public virtual XStaticResult Deploy(string folderPath)
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
                return XStaticResult.Error("Error deploying the site using FTP.", e);
            }

            return XStaticResult.Success("Site deployed using FTP.");
        }
    }
}