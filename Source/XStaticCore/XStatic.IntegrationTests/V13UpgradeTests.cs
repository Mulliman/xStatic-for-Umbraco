using System.Threading.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Cms.Tests.Common.Builders;
using Umbraco.Cms.Tests.Common.Testing;
using Umbraco.Cms.Tests.Integration.Testing;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Db.Legacy;
using XStatic.Core.Repositories;
using XStatic.Db;
using XStatic.IntegrationTests.V13;
using XStatic.Netlify;

namespace XStatic.IntegrationTests
{
    /// <summary>
    /// Builds a database the way xStatic 13.1.0 leaves it (issue #76), then runs the v17 migration plan against it.
    /// </summary>
    [TestFixture]
    [UmbracoTest(Database = UmbracoTestOptions.Database.NewSchemaPerTest)]
    public class V13UpgradeTests : UmbracoIntegrationTest
    {
        private const string StateKey = "Umbraco.Core.Upgrader.State+xStatic";

        private static readonly string[] XStaticTables =
        {
            SiteConfig.TableName,
            V13SiteConfigRow.TableName,
            DeploymentTargetDataModel.TableName,
            "XStaticActions",
            "XStaticExportTypes",
        };

        private IScopeProvider ScopeProviderInfra => GetRequiredService<IScopeProvider>();

        private IKeyValueService KeyValueService => GetRequiredService<IKeyValueService>();

        [Test]
        public void UpgradingV13Database_CreatesSitesTable_AndCopiesSites()
        {
            var (root, media1, media2) = CreateContentAndMedia();
            ResetToV13();

            InsertV13Site(new V13SiteConfigRow
            {
                Name = "Main site",
                AutoPublish = true,
                RootNode = root.Id.ToString(),
                MediaRootNodes = $"{media1.Id},{media2.Id}",
                ExportFormat = 1,
                LastRun = new DateTime(2024, 5, 1, 10, 0, 0),
                AssetPaths = "/css,/js",
                TargetHostname = "https://example.com",
                ImageCrops = "1600x900",
                PostGenerationActionIds = "[]",
                // Field names as the v13 Netlify deployer stored them.
                DeploymentTarget = """{"Id":"netlify","Name":"Netlify","Fields":{"PersonalAccessToken":"token-abc","SiteId":"site-123"}}""",
            });
            InsertV13Site(new V13SiteConfigRow
            {
                Name = "No deployer",
                RootNode = root.Id.ToString(),
                ExportFormat = 1,
            });

            Assert.That(KeyValueService.GetValue(StateKey), Is.EqualTo("init"), "precondition: v13 leaves the plan at 'init'");

            RunV17Upgrade();

            Assert.That(KeyValueService.GetValue(StateKey), Is.EqualTo(new XStaticDatabaseMigrationPlan().FinalState));

            // The exact call that returned a 500 in the issue.
            var sites = new SitesRepository(ScopeProviderInfra).GetAll().OrderBy(x => x.Name).ToList();
            Assert.That(sites.Select(x => x.Name), Is.EqualTo(new[] { "Main site", "No deployer" }));

            var main = sites[0];
            Assert.That(main.RootNode, Is.EqualTo(root.Key));
            Assert.That(main.GetMediaRootNodes(), Is.EqualTo(new[] { media1.Key, media2.Key }));
            Assert.That(main.AutoPublish, Is.True);
            Assert.That(main.ExportFormat, Is.EqualTo(1));
            Assert.That(main.AssetPaths, Is.EqualTo("/css,/js"));
            Assert.That(main.TargetHostname, Is.EqualTo("https://example.com"));
            Assert.That(main.ImageCrops, Is.EqualTo("1600x900"));
            Assert.That(main.DeploymentTarget, Is.Not.Null);

            var target = GetDeploymentTargets().Single();
            Assert.That(target.Id, Is.EqualTo(main.DeploymentTarget));
            Assert.That(target.DeployerDefinition, Is.EqualTo("netlify"));
            Assert.That(target.Config[NetlifyDeployerDefinition.FieldNames.SiteId], Is.EqualTo("site-123"));
            Assert.That(target.Config[NetlifyDeployerDefinition.FieldNames.PAT], Is.EqualTo("token-abc"));
            Assert.DoesNotThrow(() => new NetlifyDeployer(target.Config), "the migrated target, read back from the database, must build the real deployer");

            Assert.That(sites[1].DeploymentTarget, Is.Null);

            Assert.That(CountRows("XStaticExportTypes"), Is.EqualTo(1), "the 'HTML Website' export type must not be duplicated");
            Assert.That(TableExists(V13SiteConfigRow.TableName), Is.True, "the old table is left in place");
        }

        [Test]
        public void UpgradingV13Database_SkipsSitesWhoseRootNodeWasDeleted()
        {
            var (root, _, _) = CreateContentAndMedia();
            ResetToV13();

            InsertV13Site(new V13SiteConfigRow { Name = "Good", RootNode = root.Id.ToString(), ExportFormat = 1 });
            InsertV13Site(new V13SiteConfigRow
            {
                Name = "Orphan",
                RootNode = "987654",
                ExportFormat = 1,
                DeploymentTarget = """{"Id":"ftp","Name":"FTP","Fields":{"Hostname":"ftp.example.com","Username":"u","Password":"secret","Folder":"/","Port":"21"}}""",
            });

            RunV17Upgrade();

            var sites = new SitesRepository(ScopeProviderInfra).GetAll().ToList();
            Assert.That(sites.Select(x => x.Name), Is.EqualTo(new[] { "Good" }));
            Assert.That(GetDeploymentTargets(), Is.Empty, "a skipped site must not leave its deployment target (and credentials) behind");
        }

        [Test]
        public void UpgradingV13Database_SitesWithManyMediaRoots_AreStoredAndReadBack()
        {
            var contentType = ContentTypeBuilder.CreateBasicContentType();
            GetRequiredService<IContentTypeService>().CreateAsync(contentType, Umbraco.Cms.Core.Constants.Security.SuperUserKey).GetAwaiter().GetResult();
            var root = ContentBuilder.CreateBasicContent(contentType);
            GetRequiredService<IContentService>().Save(root);

            var mediaRoots = Enumerable.Range(1, 10).Select(i => CreateMediaFolder($"Media {i}")).ToList();
            ResetToV13();

            InsertV13Site(new V13SiteConfigRow
            {
                Name = "Lots of media",
                RootNode = root.Id.ToString(),
                MediaRootNodes = string.Join(",", mediaRoots.Select(x => x.Id)),
                ExportFormat = 1,
            });

            RunV17Upgrade();

            var site = new SitesRepository(ScopeProviderInfra).GetAll().Single();
            Assert.That(site.GetMediaRootNodes(), Is.EqualTo(mediaRoots.Select(x => x.Key)));
        }

        [Test]
        public void ExistingV17Database_KeepsItsSites_AndIgnoresAnyOldV13Table()
        {
            var (root, _, _) = CreateContentAndMedia();
            ResetToV13();
            InsertV13Site(new V13SiteConfigRow { Name = "Old v13", RootNode = root.Id.ToString(), ExportFormat = 1 });

            // Simulate a v17 install that already has the 14+ table and its own sites, sitting at "DeployerTargets".
            RunPlanTo("DeployerTargets", fromState: "init", createSitesTable: true);
            using (var scope = ScopeProviderInfra.CreateScope())
            {
                scope.Database.Insert(new SiteConfig { Name = "Already v17", RootNode = root.Key, ExportFormat = 1, MediaRootNodes = "" });
                scope.Complete();
            }

            RunV17Upgrade();

            var sites = new SitesRepository(ScopeProviderInfra).GetAll().ToList();
            Assert.That(sites.Select(x => x.Name), Is.EqualTo(new[] { "Already v17" }));

            // The 17.1.0 table had MediaRootNodes at the default 255 length. After the upgrade, 10 roots (369 chars) must fit.
            // Only meaningful on SQL Server (run-tests.ps1 -Database LocalDb); SQLite doesn't enforce lengths.
            var tenMediaRoots = Enumerable.Range(0, 10).Select(_ => Guid.NewGuid()).ToList();
            using (var scope = ScopeProviderInfra.CreateScope())
            {
                scope.Database.Insert(new SiteConfig
                {
                    Name = "Lots of media",
                    RootNode = root.Key,
                    ExportFormat = 1,
                    MediaRootNodes = SiteConfig.SerializeMediaRootNodes(tenMediaRoots),
                });
                scope.Complete();
            }

            var saved = new SitesRepository(ScopeProviderInfra).GetAll().Single(x => x.Name == "Lots of media");
            Assert.That(saved.GetMediaRootNodes(), Is.EqualTo(tenMediaRoots));
        }

        [Test]
        public void FreshInstall_RunsWholePlan()
        {
            DropXStatic();

            RunV17Upgrade();

            Assert.That(KeyValueService.GetValue(StateKey), Is.EqualTo(new XStaticDatabaseMigrationPlan().FinalState));
            Assert.That(new SitesRepository(ScopeProviderInfra).GetAll(), Is.Empty);
            Assert.That(CountRows("XStaticExportTypes"), Is.EqualTo(1));
            Assert.That(TableExists(V13SiteConfigRow.TableName), Is.False);
        }

        private (IContent Root, IMedia Media1, IMedia Media2) CreateContentAndMedia()
        {
            var contentType = ContentTypeBuilder.CreateBasicContentType();
            GetRequiredService<IContentTypeService>().CreateAsync(contentType, Umbraco.Cms.Core.Constants.Security.SuperUserKey).GetAwaiter().GetResult();

            var root = ContentBuilder.CreateBasicContent(contentType);
            GetRequiredService<IContentService>().Save(root);

            return (root, CreateMediaFolder("Images"), CreateMediaFolder("Documents"));
        }

        private IMedia CreateMediaFolder(string name)
        {
            var folderType = GetRequiredService<IMediaTypeService>().Get(Constants.Conventions.MediaTypes.Folder);
            var media = new Media(name, Constants.System.Root, folderType);
            GetRequiredService<IMediaService>().Save(media);
            return media;
        }

        /// <summary>Removes anything xStatic 17 created on startup and re-runs the real v13.1.0 plan.</summary>
        private void ResetToV13()
        {
            DropXStatic();
            Execute(new V13XStaticMigrationPlan());
        }

        private void DropXStatic()
        {
            using var scope = ScopeProviderInfra.CreateScope();
            foreach (var table in XStaticTables)
            {
                if (scope.SqlContext.SqlSyntax.DoesTableExist(scope.Database, table))
                {
                    scope.Database.Execute($"DROP TABLE {table}");
                }
            }

            scope.Database.Execute("DELETE FROM umbracoKeyValue WHERE [key] = @0", StateKey);
            scope.Complete();
        }

        private void InsertV13Site(V13SiteConfigRow row)
        {
            using var scope = ScopeProviderInfra.CreateScope();
            scope.Database.Insert(row);
            scope.Complete();
        }

        private void RunV17Upgrade() => Execute(new XStaticDatabaseMigrationPlan());

        /// <summary>Runs only the steps of the v17 plan up to <paramref name="toState"/>.</summary>
        private void RunPlanTo(string toState, string fromState, bool createSitesTable)
        {
            if (createSitesTable)
            {
                // MigrationAllTheThings (v17) is the step that creates the 14+ table on a fresh v17 install.
                var plan = new MigrationPlan("xStatic");
                plan.From(fromState).To<CreateV17SitesTable>(toState);
                Execute(plan);
            }
        }

        private void Execute(MigrationPlan plan)
        {
            var upgrader = new Upgrader(plan);
            upgrader.ExecuteAsync(GetRequiredService<IMigrationPlanExecutor>(), GetRequiredService<Umbraco.Cms.Core.Scoping.ICoreScopeProvider>(), KeyValueService).GetAwaiter().GetResult();
        }

        private List<DeploymentTargetDataModel> GetDeploymentTargets()
        {
            using var scope = ScopeProviderInfra.CreateScope();
            var targets = scope.Database.Fetch<DeploymentTargetDataModel>($"SELECT * FROM {DeploymentTargetDataModel.TableName}");
            scope.Complete();
            return targets;
        }

        private int CountRows(string table)
        {
            using var scope = ScopeProviderInfra.CreateScope();
            var count = scope.Database.ExecuteScalar<int>($"SELECT COUNT(*) FROM {table}");
            scope.Complete();
            return count;
        }

        private bool TableExists(string table)
        {
            using var scope = ScopeProviderInfra.CreateScope();
            var exists = scope.SqlContext.SqlSyntax.DoesTableExist(scope.Database, table);
            scope.Complete();
            return exists;
        }

        /// <summary>
        /// Creates the 14+ sites table exactly as xStatic 17.1.0 did (MediaRootNodes at the default 255 length),
        /// plus the deployment targets table.
        /// </summary>
        public class CreateV17SitesTable : XStaticMigrationBase
        {
            public CreateV17SitesTable(IMigrationContext context)
                : base(context)
            {
            }

            protected override Task MigrateAsync()
            {
                Create.Table(SiteConfig.TableName)
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
                    .WithColumn("DeploymentTarget").AsInt16().Nullable()
                    .WithColumn("TargetHostname").AsString().Nullable()
                    .WithColumn("ImageCrops").AsString().Nullable()
                    .WithColumn("PostGenerationActionIds").AsString(200).Nullable()
                    .WithColumn("Cultures").AsString(200).Nullable()
                    .Do();

                CreateDeploymentTargetTableIfMissing();

                return Task.CompletedTask;
            }
        }
    }
}
