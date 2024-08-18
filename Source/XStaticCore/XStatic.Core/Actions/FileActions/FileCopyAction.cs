using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;

namespace XStatic.Core.Actions.FileActions
{
    public class FileCopyFields
    {
        public const string FilePath = "FilePath";
        public const string NewFilePath = "NewFilePath";
    }

    [XStaticEditableField(FileCopyFields.FilePath)]
    [XStaticEditableField(FileCopyFields.NewFilePath)]
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
            var existingFilePath = GetParameter(parameters, FileCopyFields.FilePath);
            var newFilePath = GetParameter(parameters, FileCopyFields.NewFilePath);

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