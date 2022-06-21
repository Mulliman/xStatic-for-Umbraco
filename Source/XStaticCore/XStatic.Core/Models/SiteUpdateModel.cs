using System.Collections.Generic;
using XStatic.Core.Generator.Db;

namespace XStatic.Core.Models
{
    public class SiteUpdateModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public bool AutoPublish { get; set; }

        public int RootNode { get; set; }

        public string MediaRootNodes { get; set; }

        public int ExportFormat { get; set; }

        public string AssetPaths { get; set; }

        public string TargetHostname { get; set; }

        public string ImageCrops { get; set; }

        public DeploymentTargetModel DeploymentTarget { get; set; }

        public List<int> PostGenerationActionIds { get; set; }
    }
}