using System;
using XStatic.Generator;

namespace XStatic.Plugin
{
    public class SiteConfig : ISiteConfig
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool AutoPublish { get; set; }
        public int RootNode { get; set; }
        public string MediaRootNodes { get; set; }
        public string ExportFormat { get; set; }
        public DateTime? LastRun { get; set; }
        public int? LastBuildDurationInSeconds { get; set; }
        public DateTime? LastDeployed { get; set; }
        public int? LastDeployDurationInSeconds { get; set; }
        public string AssetPaths { get; set; }
        public string TargetHostname { get; set; }
        public string ImageCrops { get; set; }

        public IDeploymentTarget GetDeploymentTarget()
        {
            throw new NotImplementedException();
        }
    }
}
