using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;

namespace XStatic.Core.Actions.FileActions
{
    public class FileRenameFields
    {
        public const string FilePath = "FilePath";
        public const string NewFilePath = "NewFilePath";
    }

    [XStaticEditableField(FileRenameFields.FilePath)]
    [XStaticEditableField(FileRenameFields.NewFilePath)]
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
            var existingFilePath = GetParameter(parameters, FileRenameFields.FilePath);
            var newFilePath = GetParameter(parameters, FileRenameFields.NewFilePath);

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