using System.Threading.Tasks;
using Umbraco.Cms.Infrastructure.Migrations;

namespace XStatic.IntegrationTests.V13
{
    /// <summary>
    /// A copy of the xStatic 13.1.0 migration plan (feature/13 branch, XStatic/Db/XStaticDatabaseMigrationPlan.cs),
    /// so tests can build a database in exactly the state a v13 install leaves behind: same plan name,
    /// same "init" state, and the v13 table schemas.
    /// </summary>
    public class V13XStaticMigrationPlan : MigrationPlan
    {
        public V13XStaticMigrationPlan()
            : base("xStatic")
        {
            From(string.Empty)
                .To<V13MigrationAllTheThings>("init");
        }
    }

    public class V13MigrationAllTheThings : AsyncMigrationBase
    {
        public V13MigrationAllTheThings(IMigrationContext context)
            : base(context)
        {
        }

        protected override Task MigrateAsync()
        {
            if (!TableExists("XStaticSiteConfigs"))
            {
                Create.Table("XStaticSiteConfigs")
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
                    .WithColumn("PostGenerationActionIds").AsString(200).Nullable()
                    .Do();
            }

            if (!TableExists("XStaticActions"))
            {
                Create.Table("XStaticActions")
                    .WithColumn("Id").AsInt16().Identity()
                    .WithColumn("Name").AsString(100)
                    .WithColumn("Category").AsString(100)
                    .WithColumn("Type").AsString(500).Nullable()
                    .WithColumn("Config").AsString(2500).Nullable()
                    .Do();
            }

            if (!TableExists("XStaticExportTypes"))
            {
                Create.Table("XStaticExportTypes")
                    .WithColumn("Id").AsInt16().Identity()
                    .WithColumn("Name").AsString(100)
                    .WithColumn("TransformerFactory").AsString(500).Nullable()
                    .WithColumn("Generator").AsString(500).Nullable()
                    .WithColumn("FileNameGenerator").AsString(500).Nullable()
                    .Do();
            }

            Insert.IntoTable("XStaticExportTypes").Row(new
            {
                Name = "HTML Website",
                TransformerFactory = "XStatic.Core.Generator.Transformers.DefaultHtmlTransformerListFactory, XStatic.Core",
                Generator = "XStatic.Core.Generator.StaticHtmlSiteGenerator, XStatic.Core",
                FileNameGenerator = "XStatic.Core.Generator.Storage.EverythingIsIndexHtmlFileNameGenerator, XStatic.Core"
            }).Do();

            return Task.CompletedTask;
        }
    }
}
