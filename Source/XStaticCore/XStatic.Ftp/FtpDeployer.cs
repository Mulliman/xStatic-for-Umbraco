using FluentFTP;
using System;
using System.Collections.Generic;
using System.Linq;
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
                var config = new FtpConfig
                {
                    EncryptionMode = FtpEncryptionMode.Auto,
                    ValidateAnyCertificate = true
                };

                using var client = new FtpClient(_hostname, _username, _password, _port, config);
                client.Connect();

                var remoteFolder = string.IsNullOrEmpty(_folder) ? "/" : _folder;

                var results = client.UploadDirectory(folderPath, remoteFolder, FtpFolderSyncMode.Mirror);

                var failed = GetFailedItems(results);
                if (failed.Count > 0)
                {
                    var first = failed[0];
                    var reason = first.Exception?.Message
                        ?? "the server did not confirm the upload. If folders were created but files were not, the data "
                         + "connection is probably blocked: check the server's passive mode settings and firewall.";
                    return XStaticResult.Error($"FTP deploy failed for {failed.Count} of {results.Count} item(s). First: {first.RemotePath}: {reason}", first.Exception);
                }
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error deploying the site using FTP.", e);
            }

            return XStaticResult.Success("Site deployed using FTP.");
        }

        /// <summary>
        /// Gets the items that didn't upload. FluentFTP doesn't always mark a failed transfer as failed: when the data
        /// connection can't be opened, files come back as neither successful nor failed, with no exception. So anything
        /// not confirmed as uploaded or deliberately skipped counts as a failure.
        /// </summary>
        public static IReadOnlyList<FtpResult> GetFailedItems(IEnumerable<FtpResult> results)
        {
            return (results ?? Enumerable.Empty<FtpResult>())
                .Where(r => r.IsFailed || (!r.IsSuccess && !r.IsSkipped && !r.IsSkippedByRule))
                .ToList();
        }
    }
}