using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Helpers;

namespace XStatic.Core.Actions.FileActions
{
    [XStaticEditableField("FilePath", "File Path")]
    public class FileDeleteAction : PostGenerationActionBase
    {
        private readonly IStaticSiteStorer _staticSiteStorer;

        public override string Name => nameof(FileDeleteAction);

        public FileDeleteAction(IStaticSiteStorer staticSiteStorer)
        {
            _staticSiteStorer = staticSiteStorer;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var existingFilePath = GetParameter(parameters, "FilePath");

            return await DeleteFile(staticSiteId, existingFilePath);
        }

        protected virtual async Task<XStaticResult> DeleteFile(int staticSiteId, string existingFilePath)
        {
            var absoluteFilePath = FileHelpers.PathCombine(_staticSiteStorer.GetStorageLocationOfSite(staticSiteId), existingFilePath);

            try
            {
                await _staticSiteStorer.DeleteFile(absoluteFilePath);
            }
            catch (Exception e)
            {
                return XStaticResult.Error("Error running file delete action", e);
            }

            return XStaticResult.Success();
        }
    }
}