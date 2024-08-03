using System;
using System.Collections.Generic;
using XStatic.Core.Generator.Db;

namespace XStatic.Core.Models
{
    public class SiteUpdateModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public bool AutoPublish { get; set; }

        public Guid RootNode { get; set; }

        public IEnumerable<Guid> MediaRootNodes { get; set; }

        public int ExportFormat { get; set; }

        public string AssetPaths { get; set; }

        public string TargetHostname { get; set; }

        public string ImageCrops { get; set; }

        public int? DeploymentTarget { get; set; }

        public List<int> PostGenerationActionIds { get; set; }
    }
}