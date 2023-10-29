using NPoco;
using System;
using System.Collections.Generic;
using Umbraco.Cms.Infrastructure.Persistence.DatabaseAnnotations;

namespace XStatic.Core.Generator.Db
{
    [TableName(TableName)]
    [PrimaryKey("Id", AutoIncrement = true)]
    public class HeadlessSiteConfig : ISiteConfig
    {
        public const string TableName = "XStaticHeadlessSiteConfigs";

        #region Common

        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        public string Name { get; set; }

        public int RootNode { get; set; }

        [SerializedColumn]
        public List<int> PostGenerationActionIds { get; set; }

        #endregion

        #region Pages

        public bool EnablePageGeneration { get; set; }

        public string AssetPaths { get; set; }

        public string TargetHostname { get; set; }

        public int ExportFormat { get; set; }

        #endregion

        #region Headless

        public bool EnableHeadlessApiGeneration { get; set; }

        public string ApiKey { get; set; }

        public string DefaultApiPath { get; set; }

        public string DefaultCulture { get; set; }

        public bool DefaultUsePreview { get; set; }

        [SerializedColumn]
        public List<int> HeadlessApiRequestIds { get; set; }

        #endregion

        #region Media

        public bool EnableMediaGeneration { get; set; }

        public string MediaRootNodes { get; set; }

        public string ImageCrops { get; set; }

        #endregion

        #region Deploy

        public bool AutoPublish { get; set; }

        [SerializedColumn]
        public DeploymentTargetModel DeploymentTarget { get; set; }

        public IDeploymentTarget GetDeploymentTarget()
        {
            return DeploymentTarget;
        }

        #endregion

        #region Stats

        public DateTime? LastRun { get; set; }

        public int? LastBuildDurationInSeconds { get; set; }

        public DateTime? LastDeployed { get; set; }

        public int? LastDeployDurationInSeconds { get; set; }

        #endregion
    }
}
