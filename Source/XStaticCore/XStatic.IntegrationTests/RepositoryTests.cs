using System;
using System.Collections.Generic;
using System.Linq;
using NUnit.Framework;
using Umbraco.Cms.Core.Migrations;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;
using Umbraco.Cms.Infrastructure.Scoping;
using Umbraco.Cms.Tests.Common.Testing;
using Umbraco.Cms.Tests.Integration.Testing;
using XStatic.Core;
using XStatic.Core.Actions;
using XStatic.Core.Actions.Db;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Models;
using XStatic.Core.Repositories;
using XStatic.Db;

namespace XStatic.IntegrationTests
{
    /// <summary>
    /// Round-trips each repository through a real database created by the xStatic migration plan.
    /// </summary>
    [TestFixture]
    [UmbracoTest(Database = UmbracoTestOptions.Database.NewSchemaPerTest)]
    public class RepositoryTests : UmbracoIntegrationTest
    {
        private IScopeProvider Scopes => GetRequiredService<IScopeProvider>();

        [SetUp]
        public void CreateXStaticTables()
        {
            // A no-op when the tables already exist at the final state.
            var upgrader = new Upgrader(new XStaticDatabaseMigrationPlan());
            upgrader.ExecuteAsync(
                GetRequiredService<IMigrationPlanExecutor>(),
                GetRequiredService<Umbraco.Cms.Core.Scoping.ICoreScopeProvider>(),
                GetRequiredService<IKeyValueService>()).GetAwaiter().GetResult();
        }

        private static SiteUpdateModel NewSite(string name = "Main site") => new()
        {
            Name = name,
            AutoPublish = false,
            RootNode = Guid.NewGuid(),
            MediaRootNodes = new[] { Guid.NewGuid(), Guid.NewGuid() },
            ExportFormat = 1,
            AssetPaths = "/css,/js",
            TargetHostname = "https://www.example.com",
            ImageCrops = "1600x900,800x450@75",
            DeploymentTarget = 4,
            PostGenerationActionIds = new List<int> { 2, 3 },
            Cultures = new List<string> { "en-GB", "da-DK" },
        };

        [Test]
        public void Sites_CreateGetUpdateDelete_RoundTripsEveryField()
        {
            var repo = new SitesRepository(Scopes);
            var input = NewSite();

            var created = repo.Create(input);

            Assert.That(created.Id, Is.GreaterThan(0));
            var loaded = repo.Get<SiteConfig>(created.Id);
            Assert.Multiple(() =>
            {
                Assert.That(loaded.Name, Is.EqualTo("Main site"));
                Assert.That(loaded.RootNode, Is.EqualTo(input.RootNode));
                Assert.That(loaded.GetMediaRootNodes(), Is.EqualTo(input.MediaRootNodes));
                Assert.That(loaded.ExportFormat, Is.EqualTo(1));
                Assert.That(loaded.AssetPaths, Is.EqualTo("/css,/js"));
                Assert.That(loaded.TargetHostname, Is.EqualTo("https://www.example.com"));
                Assert.That(loaded.ImageCrops, Is.EqualTo("1600x900,800x450@75"));
                Assert.That(loaded.DeploymentTarget, Is.EqualTo(4));
                Assert.That(loaded.PostGenerationActionIds, Is.EqualTo(new[] { 2, 3 }));
                Assert.That(loaded.Cultures, Is.EqualTo(new[] { "en-GB", "da-DK" }));
                Assert.That(loaded.LastRun, Is.Null);
            });

            input.Id = created.Id;
            input.Name = "Renamed";
            input.AutoPublish = true;
            input.MediaRootNodes = Array.Empty<Guid>();
            input.Cultures = new List<string>();
            var updated = repo.Update(input);

            Assert.That(updated.Name, Is.EqualTo("Renamed"));
            Assert.That(updated.AutoPublish, Is.True);
            Assert.That(repo.Get<SiteConfig>(created.Id).GetMediaRootNodes(), Is.Empty);

            repo.Delete(created.Id);

            Assert.That(repo.Get<SiteConfig>(created.Id), Is.Null);
        }

        [Test]
        public void Sites_GetAllAndAutoPublish_FilterCorrectly()
        {
            var repo = new SitesRepository(Scopes);
            repo.Create(NewSite("Manual"));
            var auto = NewSite("Auto");
            auto.AutoPublish = true;
            repo.Create(auto);

            Assert.That(repo.GetAll().Select(s => s.Name), Is.EquivalentTo(new[] { "Manual", "Auto" }));
            Assert.That(repo.GetAutoPublishSites().Select(s => s.Name), Is.EqualTo(new[] { "Auto" }));
        }

        [Test]
        public void Sites_UpdateLastRunAndDeploy_RecordTimesAndDurations()
        {
            var repo = new SitesRepository(Scopes);
            var site = repo.Create(NewSite());
            var before = DateTime.Now.AddSeconds(-5);

            repo.UpdateLastRun(site.Id, 12);
            repo.UpdateLastDeploy(site.Id, 34);

            var loaded = repo.Get<SiteConfig>(site.Id);
            Assert.That(loaded.LastRun, Is.GreaterThan(before));
            Assert.That(loaded.LastBuildDurationInSeconds, Is.EqualTo(12));
            Assert.That(loaded.LastDeployed, Is.GreaterThan(before));
            Assert.That(loaded.LastDeployDurationInSeconds, Is.EqualTo(34));
        }

        [Test]
        public void Sites_UpdateLastRun_UnknownSite_ThrowsXStaticException()
        {
            Assert.Throws<XStaticException>(() => new SitesRepository(Scopes).UpdateLastRun(9999, 1));
        }

        [Test]
        public void Sites_Get_UnknownSite_ReturnsNull()
        {
            Assert.That(new SitesRepository(Scopes).Get<SiteConfig>(9999), Is.Null);
        }

        [Test]
        public void DeploymentTargets_RoundTripConfigDictionary()
        {
            var repo = new DeploymentTargetRepository(Scopes);
            var created = repo.Create(new DeploymentTargetDataModel
            {
                Name = "Netlify prod",
                DeployerDefinition = "netlify",
                Config = new Dictionary<string, string> { ["Netlify.PAT"] = "token", ["Netlify.SiteId"] = "site-1" },
            });

            var loaded = repo.Get(created.Id);
            Assert.That(loaded.Name, Is.EqualTo("Netlify prod"));
            Assert.That(loaded.DeployerDefinition, Is.EqualTo("netlify"));
            Assert.That(loaded.Config, Is.EquivalentTo(new Dictionary<string, string> { ["Netlify.PAT"] = "token", ["Netlify.SiteId"] = "site-1" }));

            loaded.Config["Netlify.SiteId"] = "site-2";
            repo.Update(loaded);
            Assert.That(repo.Get(created.Id).Config["Netlify.SiteId"], Is.EqualTo("site-2"));
            Assert.That(repo.GetAll().Count(), Is.EqualTo(1));

            repo.Delete(created.Id);
            Assert.That(repo.Get(created.Id), Is.Null);
        }

        [Test]
        public void Actions_RoundTripAndFilterByCategory()
        {
            var repo = new ActionRepository(Scopes);
            var copy = repo.Create(new ActionDataModel
            {
                Name = "Copy 404",
                Category = "html",
                Type = "XStatic.Core.Actions.FileActions.FileCopyAction, XStatic.Core",
                Config = new Dictionary<string, string> { ["FilePath"] = "/404/index.html", ["NewFilePath"] = "404.html" },
            });
            repo.Create(new ActionDataModel { Name = "Json thing", Category = "json", Type = "Some.Type", Config = new() });

            var loaded = repo.Get(copy.Id);
            Assert.That(loaded.Type, Is.EqualTo("XStatic.Core.Actions.FileActions.FileCopyAction, XStatic.Core"));
            Assert.That(loaded.Config["NewFilePath"], Is.EqualTo("404.html"));
            Assert.That(repo.GetAllInCategory("html").Select(a => a.Name), Is.EqualTo(new[] { "Copy 404" }));
            Assert.That(repo.GetAll().Count(), Is.EqualTo(2));

            loaded.Name = "Copy 404 page";
            repo.Update(loaded);
            Assert.That(repo.Get(copy.Id).Name, Is.EqualTo("Copy 404 page"));

            repo.Delete(copy.Id);
            Assert.That(repo.Get(copy.Id), Is.Null);
        }

        [Test]
        public void ExportTypes_RoundTrip()
        {
            var repo = new ExportTypeRepository(Scopes);
            var existing = repo.GetAll().Count();

            var created = repo.Create(new ExportTypeDataModel
            {
                Name = "Custom JSON",
                Generator = "XStatic.Generator.BasicJsonApiGenerator, XStatic.Core",
                TransformerFactory = "XStatic.Core.Generator.Transformers.DefaultJsonTransformerListFactory, XStatic.Core",
                FileNameGenerator = "XStatic.Core.Generator.Storage.JsonFileNameGenerator, XStatic.Core",
            });

            var loaded = repo.Get(created.Id);
            Assert.That(loaded.Name, Is.EqualTo("Custom JSON"));
            Assert.That(loaded.FileNameGenerator, Is.EqualTo("XStatic.Core.Generator.Storage.JsonFileNameGenerator, XStatic.Core"));
            Assert.That(repo.GetAll().Count(), Is.EqualTo(existing + 1));

            loaded.Name = "Renamed JSON";
            repo.Update(loaded);
            Assert.That(repo.Get(created.Id).Name, Is.EqualTo("Renamed JSON"));

            repo.Delete(created.Id);
            Assert.That(repo.Get(created.Id), Is.Null);
        }
    }
}
