CREATE TABLE [XStaticSiteConfigs] (
  [Id] int IDENTITY (1,1) NOT NULL
, [Name] nvarchar(255) NOT NULL
, [AutoPublish] bit NOT NULL
, [RootNode] nvarchar(255) NOT NULL
, [MediaRootNodes] nvarchar(255) NULL
, [ExportFormat] nvarchar(255) NOT NULL
, [LastRun] datetime NULL
, [LastDeployed] datetime NULL
, [AssetPaths] nvarchar(1000) NULL
, [DeploymentTarget] nvarchar(2000) NULL
, [LastBuildDurationInSeconds] int NULL
, [LastDeployDurationInSeconds] int NULL
);