﻿using System;
using System.Collections.Generic;

namespace XStatic.Core.Generator
{
    public interface ISiteConfig
    {
        int Id { get; set; }

        string Name { get; set; }

        bool AutoPublish { get; set; }

        Guid RootNode { get; set; }

        string MediaRootNodes { get; set; }

        int ExportFormat { get; set; }

        DateTime? LastRun { get; set; }

        int? LastBuildDurationInSeconds { get; set; }

        DateTime? LastDeployed { get; set; }

        int? LastDeployDurationInSeconds { get; set; }

        string AssetPaths { get; set; }

        string TargetHostname { get; set; }

        string ImageCrops { get; set; }

        List<int> PostGenerationActionIds { get; set; }

        List<string> Cultures { get; set; }
    }

    public interface IDeploymentTarget
    {
        string Id { get; set; }

        string Name { get; set; }

        Dictionary<string, string> Fields { get; set; }
    }
}
