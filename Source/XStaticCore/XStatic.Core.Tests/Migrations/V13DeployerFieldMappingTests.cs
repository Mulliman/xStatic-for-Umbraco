using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Deploy;
using XStatic.Core.Generator.Db.Legacy;
using XStatic.Ftp;
using XStatic.Git;
using XStatic.Netlify;
using Xunit;

namespace XStatic.Core.Tests.Migrations
{
    /// <summary>
    /// Checks the v13 → v17 deployer field mapping against the real v17 deployer definitions and constructors,
    /// so a migrated deployment target can actually be used to deploy.
    /// </summary>
    public class V13DeployerFieldMappingTests
    {
        // Field names exactly as the xStatic 13.1.0 deployer definitions declared them (feature/13 branch).
        public static IEnumerable<object[]> V13Deployers => new[]
        {
            new object[] { "netlify", new[] { "PersonalAccessToken", "SiteId" } },
            new object[] { "git", new[] { "RemoteUrl", "Email", "Username", "Password", "Branch" } },
            new object[] { "ftp", new[] { "Hostname", "Username", "Password", "Folder", "Port" } },
            new object[] { "filesystem", new[] { "FolderPath" } },
        };

        private static readonly Dictionary<string, (IDeployerDefinition Definition, Func<Dictionary<string, string>, IDeployer> Create)> V17Deployers = new()
        {
            ["netlify"] = (new NetlifyDeployerDefinition(), p => new NetlifyDeployer(p)),
            ["git"] = (new GitDeployerDefinition(), p => new GitDeployer(p)),
            ["ftp"] = (new FtpDeployerDefinition(), p => new FtpDeployer(p)),
            ["filesystem"] = (new FileSystemDeployerDefinition(), p => new FileSystemDeployer(p)),
        };

        [Theory]
        [MemberData(nameof(V13Deployers))]
        public void MigratedTarget_HasExactlyTheV17DefinitionFields(string deployerId, string[] v13Fields)
        {
            var target = Convert(deployerId, v13Fields);
            var (definition, _) = V17Deployers[deployerId];

            Assert.Equal(definition.Id, target.DeployerDefinition);
            Assert.Equal(definition.Fields.Select(f => f.Alias).OrderBy(x => x), target.Config.Keys.OrderBy(x => x));
        }

        [Theory]
        [MemberData(nameof(V13Deployers))]
        public void MigratedTarget_CanConstructTheRealDeployer(string deployerId, string[] v13Fields)
        {
            var target = Convert(deployerId, v13Fields);
            var (_, create) = V17Deployers[deployerId];

            var deployer = create(target.Config);

            Assert.NotNull(deployer);
        }

        [Fact]
        public void MapFieldNames_KeepsValues()
        {
            var config = V13SiteConfigConverter.MapFieldNames("ftp", new Dictionary<string, string>
            {
                ["Hostname"] = "ftp.example.com",
                ["Password"] = "p@ss",
                ["Port"] = "2121",
            });

            Assert.Equal("ftp.example.com", config[FtpDeployerDefinition.FieldNames.Hostname]);
            Assert.Equal("p@ss", config[FtpDeployerDefinition.FieldNames.Password]);
            Assert.Equal("2121", config[FtpDeployerDefinition.FieldNames.Port]);
        }

        [Fact]
        public void MapFieldNames_LeavesCustomDeployersAndNewStyleKeysAlone()
        {
            var custom = V13SiteConfigConverter.MapFieldNames("my-custom-deployer", new Dictionary<string, string> { ["Username"] = "x" });
            Assert.Equal("x", custom["Username"]);

            var alreadyNew = V13SiteConfigConverter.MapFieldNames("git", new Dictionary<string, string> { [GitDeployerDefinition.FieldNames.Branch] = "main" });
            Assert.Equal("main", alreadyNew[GitDeployerDefinition.FieldNames.Branch]);
        }

        [Fact]
        public void FieldNameMap_CoversEveryBuiltInDeployer()
        {
            Assert.Equal(V17Deployers.Keys.OrderBy(x => x), V13SiteConfigConverter.FieldNameMap.Keys.OrderBy(x => x));
        }

        private static Core.Deploy.Targets.Db.DeploymentTargetDataModel Convert(string deployerId, string[] v13Fields)
        {
            var fields = string.Join(",", v13Fields.Select(f => $"\"{f}\":\"value-{f}\""));
            var json = $"{{\"Id\":\"{deployerId}\",\"Name\":\"{deployerId}\",\"Fields\":{{{fields}}}}}";

            var target = V13SiteConfigConverter.ConvertDeploymentTarget(json, "Site");
            Assert.NotNull(target);
            return target;
        }
    }
}
