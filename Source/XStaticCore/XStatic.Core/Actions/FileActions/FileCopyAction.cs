using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;

namespace XStatic.Core.Actions.FileActions
{
    [XStaticEditableField("FilePath", "File Path")]
    [XStaticEditableField("NewFilePath", "New File Path")]
    public class FileCopyAction : PostGenerationActionBase
    {
        private readonly IStaticSiteStorer _staticSiteStorer;

        public override string Name => nameof(FileCopyAction);

        public FileCopyAction(IStaticSiteStorer staticSiteStorer)
        {
            _staticSiteStorer = staticSiteStorer;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var existingFilePath = GetParameter(parameters, "FilePath");
            var newFilePath = GetParameter(parameters, "NewFilePath");

            return await CopyFile(staticSiteId, existingFilePath, newFilePath);
        }

        protected virtual async Task<XStaticResult> CopyFile(int staticSiteId, string existingFilePath, string newFilePath)
        {
            var absoluteFilePath = FileHelpers.PathCombine(_staticSiteStorer.GetStorageLocationOfSite(staticSiteId), existingFilePath);

            try
            {
                await _staticSiteStorer.CopyFile(staticSiteId.ToString(), absoluteFilePath, newFilePath);
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error running file copy action", e);
            }

            return XStaticResult.Success();
        }
    }
}