using NPoco;
using System;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator;
using XStatic.Core.Models;
using System.Collections.Generic;

namespace XStatic.Models
{
    public class SiteApiModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public bool AutoPublish { get; set; }

        public Guid RootNode { get; set; }

        public IEnumerable<Guid> MediaRootNodes { get; set; }

        public int ExportFormat { get; set; }

        public DateTime? LastRun { get; set; }

        public int? LastBuildDurationInSeconds { get; set; }

        public DateTime? LastDeployed { get; set; }

        public int? LastDeployDurationInSeconds { get; set; }

        public string AssetPaths { get; set; }

        public string TargetHostname { get; set; }

        public string ImageCrops { get; set; }
        
        public DeploymentTargetModel DeploymentTarget { get; set; }


        public List<int> PostGenerationActionIds { get; set; }

        public string RootPath { get; set; }

        public string ExportTypeName { get; set; }

        public string FolderSize { get; set; }

        public SiteApiModel(ExtendedGeneratedSite site)
        {
            Id = site.Id;
            Name = site.Name;
            RootPath = site.RootPath;
            ExportTypeName = site.ExportTypeName;
            FolderSize = site.FolderSize;
            AutoPublish = site.AutoPublish;
            RootNode = site.RootNode;
            MediaRootNodes = site.GetMediaRootNodes();
            ExportFormat = site.ExportFormat;
            LastRun = site.LastRun;
            LastBuildDurationInSeconds = site.LastBuildDurationInSeconds;
            LastDeployed = site.LastDeployed;
            LastDeployDurationInSeconds = site.LastDeployDurationInSeconds;
            AssetPaths = site.AssetPaths;
            TargetHostname = site.TargetHostname;
            ImageCrops = site.ImageCrops;
            DeploymentTarget = site.DeploymentTarget;
            PostGenerationActionIds = site.PostGenerationActionIds;
        }
    }
}
