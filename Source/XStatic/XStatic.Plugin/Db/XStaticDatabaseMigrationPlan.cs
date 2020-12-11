using Umbraco.Core.Migrations;

namespace XStatic.Plugin.Db
{
    public class XStaticDatabaseMigrationPlan : MigrationPlan
    {
        public XStaticDatabaseMigrationPlan()
            : base("xStatic")
        {
            From(string.Empty)
                .To<MigrationCreateTable>("init");
        }
    }

    public class MigrationCreateTable : MigrationBase
    {
        public MigrationCreateTable(IMigrationContext context)
            : base(context)
        {
        }

        public override void Migrate()
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
}
