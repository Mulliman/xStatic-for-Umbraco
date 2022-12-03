using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core.Helpers;

namespace XStatic.Core.Deploy
{
    public class FileSystemDeployer : IDeployer
    {
        public const string DeployerKey = "filesystem";
        private readonly string _folderPath;

        public FileSystemDeployer(Dictionary<string, string> parameters)
        {
            _folderPath = parameters["FolderPath"];
        }

        public Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            return TaskHelper.FromResultOf(() =>
            {
                try
                {
                    FileHelpers.CopyFilesInFolder(folderPath, _folderPath);
                }
                catch (Exception e)
                {
                    return XStaticResult.Error("Error deploying site to file system.", e);
                }

                return XStaticResult.Success("Folder on file system updated.");
            });
        }
    }
}