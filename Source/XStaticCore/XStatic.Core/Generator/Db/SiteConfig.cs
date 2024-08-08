using NPoco;
using System;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Infrastructure.Persistence.DatabaseAnnotations;

namespace XStatic.Core.Generator.Db
{
    [TableName(TableName)]
    [PrimaryKey("Id", AutoIncrement = true)]
    public class SiteConfig : ISiteConfig
    {
        public const string TableName = "XStaticSiteConfigs14Plus";

        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        public string Name { get; set; }

        public bool AutoPublish { get; set; }

        public Guid RootNode { get; set; }

        public string MediaRootNodes { get; set; }

        public int ExportFormat { get; set; }

        public DateTime? LastRun { get; set; }

        public int? LastBuildDurationInSeconds { get; set; }

        public DateTime? LastDeployed { get; set; }

        public int? LastDeployDurationInSeconds { get; set; }

        public string AssetPaths { get; set; }

        public string TargetHostname { get; set; }

        public string ImageCrops { get; set; }

        public int? DeploymentTarget { get; set; }

        [SerializedColumn]
        public List<int> PostGenerationActionIds { get; set; }

        [SerializedColumn]
        public List<string> Cultures { get; set; }

        public IEnumerable<Guid> GetMediaRootNodes()
        {
            if (string.IsNullOrWhiteSpace(MediaRootNodes))
            {
                return new List<Guid>();
            }

            return MediaRootNodes.Split(',').Select(Guid.Parse);
        }

        public static string SerializeMediaRootNodes(IEnumerable<Guid> mediaNodes)
        {
            if (mediaNodes?.Any() != true)
            {
                return string.Empty;
            }

            return mediaNodes.Select(x => x.ToString()).Aggregate((x, y) => $"{x},{y}");
        }
    }

    //public class DeploymentTargetModel : IDeploymentTarget
    //{
    //    public string Id { get; set; }

    //    public string Name { get; set; }

    //    public Dictionary<string, string> Fields { get; set; }
    //}

    //public class DeploymentTargetField
    //{
    //    public string FieldType { get; set; }

    //    public string Value { get; set; }

    //    public bool IsMandatory { get; set; }
    //}
}
