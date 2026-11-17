using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Db.Legacy;
using Xunit;

namespace XStatic.Core.Tests.Migrations
{
    public class V13SiteConfigConverterTests
    {
        private static readonly Guid RootKey = Guid.NewGuid();
        private static readonly Guid MediaKey1 = Guid.NewGuid();
        private static readonly Guid MediaKey2 = Guid.NewGuid();

        private static readonly IReadOnlyDictionary<int, Guid> NodeKeys = new Dictionary<int, Guid>
        {
            [1050] = RootKey,
            [2001] = MediaKey1,
            [2002] = MediaKey2,
        };

        private static V13SiteConfigRow CreateRow() => new()
        {
            Id = 3,
            Name = "My Site",
            AutoPublish = true,
            RootNode = "1050",
            MediaRootNodes = "2001, 2002",
            ExportFormat = 1,
            LastRun = new DateTime(2024, 1, 2),
            LastBuildDurationInSeconds = 12,
            LastDeployed = new DateTime(2024, 1, 3),
            LastDeployDurationInSeconds = 34,
            AssetPaths = "/assets/css,/assets/js",
            TargetHostname = "https://example.com",
            ImageCrops = "1600x900",
            PostGenerationActionIds = "[4,5]",
            DeploymentTarget = """{"Id":"netlify","Name":"Netlify","Fields":{"PersonalAccessToken":"secret","SiteId":"abc"}}"""
        };

        [Fact]
        public void GetReferencedNodeIds_ReturnsRootAndMediaIds()
        {
            var ids = V13SiteConfigConverter.GetReferencedNodeIds(CreateRow()).ToList();

            Assert.Equal(new[] { 1050, 2001, 2002 }, ids);
        }

        [Fact]
        public void ConvertSite_MapsIdsToKeysAndCopiesFields()
        {
            var row = CreateRow();

            var site = V13SiteConfigConverter.ConvertSite(row, NodeKeys, deploymentTargetId: 7);

            Assert.NotNull(site);
            Assert.Equal(RootKey, site.RootNode);
            Assert.Equal(new[] { MediaKey1, MediaKey2 }, site.GetMediaRootNodes());
            Assert.Equal(7, site.DeploymentTarget);
            Assert.Equal(new List<int> { 4, 5 }, site.PostGenerationActionIds);
            Assert.Empty(site.Cultures);
            Assert.Equal(row.Name, site.Name);
            Assert.Equal(row.AutoPublish, site.AutoPublish);
            Assert.Equal(row.ExportFormat, site.ExportFormat);
            Assert.Equal(row.LastRun, site.LastRun);
            Assert.Equal(row.LastBuildDurationInSeconds, site.LastBuildDurationInSeconds);
            Assert.Equal(row.LastDeployed, site.LastDeployed);
            Assert.Equal(row.LastDeployDurationInSeconds, site.LastDeployDurationInSeconds);
            Assert.Equal(row.AssetPaths, site.AssetPaths);
            Assert.Equal(row.TargetHostname, site.TargetHostname);
            Assert.Equal(row.ImageCrops, site.ImageCrops);
        }

        [Fact]
        public void ConvertSite_ReturnsNull_WhenRootNodeNoLongerExists()
        {
            var row = CreateRow();
            row.RootNode = "9999";

            Assert.Null(V13SiteConfigConverter.ConvertSite(row, NodeKeys, null));
        }

        [Fact]
        public void ConvertSite_DropsUnknownMediaRoots()
        {
            var row = CreateRow();
            row.MediaRootNodes = "2001,9999";

            var site = V13SiteConfigConverter.ConvertSite(row, NodeKeys, null);

            Assert.Equal(new[] { MediaKey1 }, site.GetMediaRootNodes());
        }

        [Fact]
        public void ConvertSite_HandlesEmptyOptionalFields()
        {
            var row = CreateRow();
            row.MediaRootNodes = null;
            row.PostGenerationActionIds = null;

            var site = V13SiteConfigConverter.ConvertSite(row, NodeKeys, null);

            Assert.Empty(site.GetMediaRootNodes());
            Assert.Empty(site.PostGenerationActionIds);
            Assert.Null(site.DeploymentTarget);
        }

        [Fact]
        public void ConvertSite_TenMediaRoots_FitInWidenedColumn()
        {
            var keys = Enumerable.Range(3000, 10).ToDictionary(x => x, _ => Guid.NewGuid());
            keys[1050] = RootKey;
            var row = CreateRow();
            row.MediaRootNodes = string.Join(",", Enumerable.Range(3000, 10));

            var site = V13SiteConfigConverter.ConvertSite(row, keys, null);

            Assert.Equal(10, site.GetMediaRootNodes().Count());
            Assert.True(site.MediaRootNodes.Length > 255);
            Assert.True(site.MediaRootNodes.Length <= XStatic.Db.XStaticMigrationBase.MediaRootNodesLength);
        }

        [Fact]
        public void ConvertDeploymentTarget_MapsInlineJson()
        {
            var target = V13SiteConfigConverter.ConvertDeploymentTarget(CreateRow().DeploymentTarget, "My Site");

            Assert.NotNull(target);
            Assert.Equal("netlify", target.DeployerDefinition);
            Assert.Equal("My Site (Netlify)", target.Name);
            Assert.Equal("abc", target.Config["Netlify.SiteId"]);
            Assert.Equal("secret", target.Config["Netlify.PAT"]);
        }

        [Fact]
        public void ConvertDeploymentTarget_AcceptsCamelCaseJson()
        {
            var target = V13SiteConfigConverter.ConvertDeploymentTarget("""{"id":"git","name":"Git","fields":{"Branch":"main"}}""", "Site");

            Assert.Equal("git", target.DeployerDefinition);
            Assert.Equal("main", target.Config["Git.Branch"]);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("not json")]
        [InlineData("""{"Name":"No id"}""")]
        public void ConvertDeploymentTarget_ReturnsNull_ForMissingOrInvalidJson(string json)
        {
            Assert.Null(V13SiteConfigConverter.ConvertDeploymentTarget(json, "Site"));
        }
    }
}
