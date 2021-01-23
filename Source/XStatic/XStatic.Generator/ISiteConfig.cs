using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Generator
{
    public interface ISiteConfig
    {
        int Id { get; set; }

        string Name { get; set; }

        bool AutoPublish { get; set; }

        string RootNode { get; set; }

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
        string id { get; set; }

        string name { get; set; }

        Dictionary<string, string> fields { get; set; }
    }
}