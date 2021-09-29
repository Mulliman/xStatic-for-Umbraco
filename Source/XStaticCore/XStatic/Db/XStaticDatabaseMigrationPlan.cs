using Umbraco.Cms.Infrastructure.Migrations;

namespace XStatic.Plugin.Db
{
    public class XStaticDatabaseMigrationPlan : MigrationPlan
    {
        public XStaticDatabaseMigrationPlan()
            : base("xStatic")
        {
            From(string.Empty)
                .To<MigrationCreateTable>("init")
                .To<MigrationAddTargetHostnameField>("Add Target Hostname field")
                .To<MigrationAddImageCropsField>("Add Image crops field")
                .To<MigrationMakeSomeFieldsLonger>("Make some fields longer");
        }
    }

    public class MigrationCreateTable : MigrationBase
    {
        public MigrationCreateTable(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            if (!TableExists("XStaticSiteConfigs"))
            {
                var builder = Create.Table("XStaticSiteConfigs")
                    .WithColumn("Id").AsInt16().Identity()
                    .WithColumn("Name").AsString()
                    .WithColumn("AutoPublish").AsBoolean()
                    .WithColumn("RootNode").AsString()
                    .WithColumn("MediaRootNodes").AsString().Nullable()
                    .WithColumn("ExportFormat").AsString()
                    .WithColumn("LastRun").AsDateTime().Nullable()
                    .WithColumn("LastBuildDurationInSeconds").AsInt16().Nullable()
                    .WithColumn("LastDeployed").AsDateTime().Nullable()
                    .WithColumn("LastDeployDurationInSeconds").AsInt16().Nullable()
                    .WithColumn("AssetPaths").AsString().Nullable()
                    .WithColumn("DeploymentTarget").AsString().Nullable();

                builder.Do();
            }
        }
    }

    public class MigrationAddTargetHostnameField : MigrationBase
    {
        public MigrationAddTargetHostnameField(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            if (TableExists("XStaticSiteConfigs"))
            {
                var builder = Alter.Table("XStaticSiteConfigs")
                    .AddColumn("TargetHostname").AsString().Nullable();

                builder.Do();
            }
        }
    }

    public class MigrationAddImageCropsField : MigrationBase
    {
        public MigrationAddImageCropsField(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            if (TableExists("XStaticSiteConfigs"))
            {
                var builder = Alter.Table("XStaticSiteConfigs")
                    .AddColumn("ImageCrops").AsString().Nullable();

                builder.Do();
            }
        }
    }

    public class MigrationMakeSomeFieldsLonger : MigrationBase
    {
        public MigrationMakeSomeFieldsLonger(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            if (TableExists("XStaticSiteConfigs"))
            {
                var builder = Alter.Table("XStaticSiteConfigs")
                    .AlterColumn("AssetPaths").AsString(1000).Nullable()
                    .AlterColumn("DeploymentTarget").AsString(2500).Nullable();

                builder.Do();
            }
        }
    }
}