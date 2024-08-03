using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Expressions.Create.Table;
using XStatic.Core.Actions.Db;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator.Db;

namespace XStatic.Db
{
    public class XStaticDatabaseMigrationPlan : MigrationPlan
    {
        public XStaticDatabaseMigrationPlan()
            : base("xStatic")
        {
            From(string.Empty)
                .To<MigrationAllTheThings>("init")
                .To<MigrationDeployerTargets>("DeployerTargets");
        }
    }

    public class MigrationAllTheThings : MigrationBase
    {
        public MigrationAllTheThings(IMigrationContext context)
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
                    .WithColumn("ExportFormat").AsInt16()
                    .WithColumn("LastRun").AsDateTime().Nullable()
                    .WithColumn("LastBuildDurationInSeconds").AsInt16().Nullable()
                    .WithColumn("LastDeployed").AsDateTime().Nullable()
                    .WithColumn("LastDeployDurationInSeconds").AsInt16().Nullable()
                    .WithColumn("AssetPaths").AsString(1000).Nullable()
                    .WithColumn("DeploymentTarget").AsString(2500).Nullable()
                    .WithColumn("TargetHostname").AsString().Nullable()
                    .WithColumn("ImageCrops").AsString().Nullable()
                    .WithColumn("PostGenerationActionIds").AsString(200).Nullable();

                builder.Do();
            }

            if (!TableExists(ActionDataModel.TableName))
            {
                var builder = Create.Table(ActionDataModel.TableName)
                    .WithColumn("Id").AsInt16().Identity()
                    .WithColumn("Name").AsString(100)
                    .WithColumn("Category").AsString(100)
                    .WithColumn("Type").AsString(500).Nullable()
                    .WithColumn("Config").AsString(2500).Nullable();

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

    public class MigrationDeployerTargets : MigrationBase
    {
        public MigrationDeployerTargets(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            if (!TableExists(DeploymentTargetDataModel.TableName))
            {
                var builder = Create.Table(DeploymentTargetDataModel.TableName)
                    .WithColumn("Id").AsInt16().Identity()
                    .WithColumn("Name").AsString(200)
                    .WithColumn("DeployerDefinition").AsString(1000)
                    .WithColumn("Config").AsString(2500).Nullable();

                builder.Do();
            }

            if (!TableExists(SiteConfig.TableName))
            {
                var builder = Alter.Table(SiteConfig.TableName)
                    .AlterColumn("DeploymentTarget").AsInt16().Nullable();

                builder.Do();
            }
        }
    }
}