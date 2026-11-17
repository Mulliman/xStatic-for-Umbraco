using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Infrastructure.Migrations;
using XStatic.Core.Actions.Db;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Db.Legacy;

namespace XStatic.Db
{
    public class XStaticDatabaseMigrationPlan : MigrationPlan
    {
        public XStaticDatabaseMigrationPlan()
            : base("xStatic")
        {
            From(string.Empty)
                .To<MigrationAllTheThings>("init")
                .To<MigrationDeployerTargets>("DeployerTargets")
                .To<MigrationUpgradeV13SiteConfigs>("UpgradeV13SiteConfigs");
        }
    }

    public abstract class XStaticMigrationBase : MigrationBase
    {
        /// <summary>Comma separated Guids are 37 chars each, so the default 255 only fits 6 media roots.</summary>
        public const int MediaRootNodesLength = 4000;

        protected XStaticMigrationBase(IMigrationContext context)
            : base(context)
        {
        }

        protected void CreateSiteConfigTableIfMissing()
        {
            if (TableExists(SiteConfig.TableName))
            {
                return;
            }

            Create.Table(SiteConfig.TableName)
                .WithColumn("Id").AsInt16().Identity()
                .WithColumn("Name").AsString()
                .WithColumn("AutoPublish").AsBoolean()
                .WithColumn("RootNode").AsString()
                .WithColumn("MediaRootNodes").AsString(MediaRootNodesLength).Nullable()
                .WithColumn("ExportFormat").AsInt16()
                .WithColumn("LastRun").AsDateTime().Nullable()
                .WithColumn("LastBuildDurationInSeconds").AsInt16().Nullable()
                .WithColumn("LastDeployed").AsDateTime().Nullable()
                .WithColumn("LastDeployDurationInSeconds").AsInt16().Nullable()
                .WithColumn("AssetPaths").AsString(1000).Nullable()
                .WithColumn("DeploymentTarget").AsInt16().Nullable()
                .WithColumn("TargetHostname").AsString().Nullable()
                .WithColumn("ImageCrops").AsString().Nullable()
                .WithColumn("PostGenerationActionIds").AsString(200).Nullable()
                .WithColumn("Cultures").AsString(200).Nullable()
                .Do();
        }

        protected void CreateDeploymentTargetTableIfMissing()
        {
            if (TableExists(DeploymentTargetDataModel.TableName))
            {
                return;
            }

            Create.Table(DeploymentTargetDataModel.TableName)
                .WithColumn("Id").AsInt16().Identity()
                .WithColumn("Name").AsString(200)
                .WithColumn("DeployerDefinition").AsString(1000)
                .WithColumn("Config").AsString(2500).Nullable()
                .Do();
        }
    }

    public class MigrationAllTheThings : XStaticMigrationBase
    {
        public MigrationAllTheThings(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            CreateSiteConfigTableIfMissing();

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

    public class MigrationDeployerTargets : XStaticMigrationBase
    {
        public MigrationDeployerTargets(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            CreateDeploymentTargetTableIfMissing();
        }
    }

    /// <summary>
    /// xStatic 13 used the same plan name and "init" state, so databases upgraded from 13 skip creating the 14+ sites table.
    /// This step creates it if missing, widens MediaRootNodes on existing installs, and copies any v13 sites across.
    /// See https://github.com/Mulliman/xStatic-for-Umbraco/issues/76.
    /// </summary>
    public class MigrationUpgradeV13SiteConfigs : XStaticMigrationBase
    {
        public MigrationUpgradeV13SiteConfigs(IMigrationContext context)
            : base(context)
        {
        }

        protected override void Migrate()
        {
            var siteTableExisted = TableExists(SiteConfig.TableName);

            CreateSiteConfigTableIfMissing();
            CreateDeploymentTargetTableIfMissing();

            if (siteTableExisted)
            {
                WidenMediaRootNodes();
            }

            CopyV13Sites();
        }

        private void WidenMediaRootNodes()
        {
            // SQLite doesn't enforce nvarchar lengths and can't alter columns, so only SQL Server needs this.
            if (IsSqlite())
            {
                return;
            }

            Alter.Table(SiteConfig.TableName)
                .AlterColumn("MediaRootNodes").AsString(MediaRootNodesLength).Nullable()
                .Do();
        }

        private void CopyV13Sites()
        {
            if (!TableExists(V13SiteConfigRow.TableName))
            {
                return;
            }

            var existingCount = Database.ExecuteScalar<int>($"SELECT COUNT(*) FROM {SiteConfig.TableName}");
            if (existingCount > 0)
            {
                Logger.LogInformation("xStatic: {Table} already has sites, so v13 sites in {OldTable} were not copied.", SiteConfig.TableName, V13SiteConfigRow.TableName);
                return;
            }

            var oldSites = Database.Fetch<V13SiteConfigRow>($"SELECT * FROM {V13SiteConfigRow.TableName}");
            if (oldSites.Count == 0)
            {
                return;
            }

            var nodeKeys = GetNodeKeys(oldSites.SelectMany(V13SiteConfigConverter.GetReferencedNodeIds).Distinct().ToList());
            var copied = 0;

            foreach (var oldSite in oldSites)
            {
                // Convert the site first so a skipped site doesn't leave an orphaned target (with credentials) behind.
                var site = V13SiteConfigConverter.ConvertSite(oldSite, nodeKeys, deploymentTargetId: null);
                if (site == null)
                {
                    Logger.LogWarning("xStatic: could not upgrade v13 site {SiteName} because its root node {RootNode} no longer exists.", oldSite.Name, oldSite.RootNode);
                    continue;
                }

                var target = V13SiteConfigConverter.ConvertDeploymentTarget(oldSite.DeploymentTarget, oldSite.Name);
                if (target != null)
                {
                    Database.Insert(target);
                    site.DeploymentTarget = target.Id;
                }

                Database.Insert(site);
                copied++;
            }

            Logger.LogWarning(
                "xStatic: upgraded {Copied} of {Total} v13 sites. Please check each site's deployment target. The old {OldTable} table has been left in place and contains deployer credentials in plain text; drop it once you're happy with the upgrade.",
                copied, oldSites.Count, V13SiteConfigRow.TableName);
        }

        private Dictionary<int, Guid> GetNodeKeys(List<int> ids)
        {
            if (ids.Count == 0)
            {
                return new Dictionary<int, Guid>();
            }

            return Database.Fetch<NodeKeyDto>("SELECT id AS Id, uniqueId AS UniqueId FROM umbracoNode WHERE id IN (@0)", ids)
                .ToDictionary(x => x.Id, x => x.UniqueId);
        }

        private bool IsSqlite() =>
            SqlSyntax.ProviderName?.Contains("sqlite", StringComparison.OrdinalIgnoreCase) == true;

        private class NodeKeyDto
        {
            public int Id { get; set; }

            public Guid UniqueId { get; set; }
        }
    }
}
