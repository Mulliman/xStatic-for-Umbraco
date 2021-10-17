using Umbraco.Cms.Infrastructure.Migrations;
using XStatic.Core.Generator.Db;

namespace XStatic.Db
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
                .To<MigrationMakeSomeFieldsLonger>("Make some fields longer")
                .To<MigrationCreateExportTypesTable>("Manage Export Types in DB");
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
            if (!TableExists(SiteConfig.TableName))
            {
                var builder = Create.Table(SiteConfig.TableName)
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
            if (TableExists(SiteConfig.TableName))
            {
                var builder = Alter.Table(SiteConfig.TableName)
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
            if (TableExists(SiteConfig.TableName))
            {
                var builder = Alter.Table(SiteConfig.TableName)
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
            if (TableExists(SiteConfig.TableName))
            {
                var builder = Alter.Table(SiteConfig.TableName)
                    .AlterColumn("AssetPaths").AsString(1000).Nullable()
                    .AlterColumn("DeploymentTarget").AsString(2500).Nullable();

                builder.Do();
            }
        }
    }

    public class MigrationCreateExportTypesTable : MigrationBase
    {
        public MigrationCreateExportTypesTable(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            if (TableExists(SiteConfig.TableName))
            {
                var builder = Alter.Table(SiteConfig.TableName)
                    .AlterColumn("ExportFormat").AsInt16();

                builder.Do();
            }

            if (!TableExists(ExportTypeDataModel.TableName))
            {
                var builder = Create.Table(ExportTypeDataModel.TableName)
                    .WithColumn("Id").AsInt16().Identity()
                    .WithColumn("Name").AsString(100)
                    .WithColumn("TransformerFactory").AsString(500).Nullable()
                    .WithColumn("Generator").AsString(500).Nullable()
                    .WithColumn("FileNameGenerator").AsString(500).Nullable();

                builder.Do();
            }

            Insert.IntoTable(ExportTypeDataModel.TableName).Row(new
            {
                Name = "HTML Website",
                TransformerFactory = "XStatic.Core.Generator.Transformers.DefaultHtmlTransformerListFactory, XStatic.Core",
                Generator = "XStatic.Core.Generator.StaticHtmlSiteGenerator, XStatic.Core",
                FileNameGenerator = "XStatic.Core.Generator.Storage.EverythingIsIndexHtmlFileNameGenerator, XStatic.Core"
            }).Do();
        }
    }
}