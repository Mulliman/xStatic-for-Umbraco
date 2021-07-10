using System;
using System.Collections.Generic;
using System.Text;

namespace XStatic.Generator
{
    public interface ISiteConfig
    {
        int Id { get; set; }

        string Name { get; set; }

        bool AutoPublish { get; set; }

        int RootNode { get; set; }

        string MediaRootNodes { get; set; }

        string ExportFormat { get; set; }

        DateTime? LastRun { get; set; }

        int? LastBuildDurationInSeconds { get; set; }

        DateTime? LastDeployed { get; set; }

        int? LastDeployDurationInSeconds { get; set; }

        string AssetPaths { get; set; }

        IDeploymentTarget GetDeploymentTarget();

        string TargetHostname { get; set; }

        string ImageCrops { get; set; }
    }

    public interface IDeploymentTarget
    {
        string Id { get; set; }

        string Name { get; set; }

        Dictionary<string, string> Fields { get; set; }
    }
}
