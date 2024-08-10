using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;

namespace XStatic.Core.Actions.FileActions
{
    [XStaticEditableField("FilePath", "File Path")]
    [XStaticEditableField("NewFilePath", "New File Path")]
    public class FileRenameAction : PostGenerationActionBase
    {
        private readonly IStaticSiteStorer _staticSiteStorer;

        public override string Name => nameof(FileRenameAction);

        public FileRenameAction(IStaticSiteStorer staticSiteStorer)
        {
            _staticSiteStorer = staticSiteStorer;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var existingFilePath = GetParameter(parameters, "FilePath");
            var newFilePath = GetParameter(parameters, "NewFilePath");

            return await MoveFile(staticSiteId, existingFilePath, newFilePath);
        }

        protected virtual async Task<XStaticResult> MoveFile(int staticSiteId, string existingFilePath, string newFilePath)
        {
            var absoluteFilePath = FileHelpers.PathCombine(_staticSiteStorer.GetStorageLocationOfSite(staticSiteId), existingFilePath);

            try
            {
                await _staticSiteStorer.MoveFile(staticSiteId.ToString(), absoluteFilePath, newFilePath);
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error running file rename action", e);
            }

            return XStaticResult.Success();
        }
    }
}