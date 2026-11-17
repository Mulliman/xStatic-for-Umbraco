using NPoco;
using System;

namespace XStatic.Core.Generator.Db.Legacy
{
    /// <summary>
    /// A raw row from the xStatic 13 (and earlier) site config table.
    /// Only used to upgrade old sites into <see cref="SiteConfig"/>.
    /// </summary>
    [TableName(TableName)]
    [PrimaryKey("Id", AutoIncrement = true)]
    public class V13SiteConfigRow
    {
        public const string TableName = "XStaticSiteConfigs";

        public int Id { get; set; }

        public string Name { get; set; }

        public bool AutoPublish { get; set; }

        /// <summary>Content node int id, stored as a string.</summary>
        public string RootNode { get; set; }

        /// <summary>Comma separated media node int ids.</summary>
        public string MediaRootNodes { get; set; }

        public int ExportFormat { get; set; }

        public DateTime? LastRun { get; set; }

        public int? LastBuildDurationInSeconds { get; set; }

        public DateTime? LastDeployed { get; set; }

        public int? LastDeployDurationInSeconds { get; set; }

        public string AssetPaths { get; set; }

        /// <summary>Inline JSON deployer definition: { Id, Name, Fields }.</summary>
        public string DeploymentTarget { get; set; }

        public string TargetHostname { get; set; }

        public string ImageCrops { get; set; }

        /// <summary>JSON array of action ids.</summary>
        public string PostGenerationActionIds { get; set; }
    }
}
