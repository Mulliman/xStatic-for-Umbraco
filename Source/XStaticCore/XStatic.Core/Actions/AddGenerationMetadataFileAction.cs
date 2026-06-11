using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.Core.Actions
{
    public class AddGenerationMetadataFileAction : PostGenerationActionBase
    {
        private readonly ISitesRepository _sitesRepository;
        private readonly IStaticSiteStorer _staticSiteStorer;
        private readonly IExportTypeService _exportTypeService;

        public override string Name => nameof(AddGenerationMetadataFileAction);

        public AddGenerationMetadataFileAction(ISitesRepository sitesRepository,
            IStaticSiteStorer staticSiteStorer,
            IExportTypeService exportTypeService)
        {
            _sitesRepository = sitesRepository;
            _staticSiteStorer = staticSiteStorer;
            _exportTypeService = exportTypeService;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var siteConfig = _sitesRepository.Get<SiteConfig>(staticSiteId);
            if (siteConfig == null)
            {
                return XStaticResult.Error("Site config not found.");
            }

            var exportTypes = _exportTypeService.GetExportTypes();
            var exportFormat = exportTypes.FirstOrDefault(x => x.Id == siteConfig.ExportFormat);
            var exportFormatName = exportFormat?.Name ?? "Unknown";

            var sb = new StringBuilder();
            sb.AppendLine($"Id: {siteConfig.Id}");
            sb.AppendLine($"Name: {siteConfig.Name}");
            sb.AppendLine($"RootNode: {siteConfig.RootNode}");
            sb.AppendLine($"LastRun: {DateTime.Now}");
            sb.AppendLine($"ExportFormat: {exportFormatName}");

            if (!string.IsNullOrEmpty(siteConfig.MediaRootNodes))
            {
                sb.AppendLine($"MediaRootNodes: {siteConfig.MediaRootNodes}");
            }

            if (!string.IsNullOrEmpty(siteConfig.AssetPaths))
            {
                sb.AppendLine($"AssetPaths: {siteConfig.AssetPaths}");
            }

            if (!string.IsNullOrEmpty(siteConfig.TargetHostname))
            {
                sb.AppendLine($"TargetHostname: {siteConfig.TargetHostname}");
            }

            if (!string.IsNullOrEmpty(siteConfig.ImageCrops))
            {
                sb.AppendLine($"ImageCrops: {siteConfig.ImageCrops}");
            }

            try
            {
                await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), ".xstatic-metadata", sb.ToString(), Encoding.UTF8);
            }
            catch (Exception ex)
            {
                return XStaticResult.Error("Failed to create metadata file.", ex);
            }

            return XStaticResult.Success();
        }
    }
}

