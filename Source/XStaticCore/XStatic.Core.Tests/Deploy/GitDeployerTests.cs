using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using LibGit2Sharp;
using XStatic.Git;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    /// <summary>
    /// Runs the Git deployer against a bare repository on disk, so clone, commit and push are real git operations.
    /// </summary>
    public sealed class GitDeployerTests : IDisposable
    {
        private readonly string _root = Path.Combine(Path.GetTempPath(), "xstatic-git-" + Guid.NewGuid().ToString("N"));
        private readonly string _remote;
        private readonly string _site;

        public GitDeployerTests()
        {
            _remote = Path.Combine(_root, "remote.git");
            _site = Path.Combine(_root, "output", "1");
            Repository.Init(_remote, isBare: true);
        }

        public void Dispose()
        {
            try
            {
                // Git marks object files read-only, which stops Directory.Delete.
                foreach (var file in Directory.EnumerateFiles(_root, "*", SearchOption.AllDirectories))
                {
                    File.SetAttributes(file, FileAttributes.Normal);
                }

                Directory.Delete(_root, recursive: true);
            }
            catch { /* best effort */ }
        }

        private GitDeployer NewDeployer(string branch) => new(new Dictionary<string, string>
        {
            [GitDeployerDefinition.FieldNames.RemoteUrl] = _remote,
            [GitDeployerDefinition.FieldNames.Email] = "xstatic@example.com",
            [GitDeployerDefinition.FieldNames.Username] = "xstatic",
            [GitDeployerDefinition.FieldNames.Password] = "unused-for-local-remotes",
            [GitDeployerDefinition.FieldNames.Branch] = branch,
        });

        /// <summary>Gives the remote a first commit on main, like a new GitHub repository with a README.</summary>
        private void SeedRemote()
        {
            var seed = Path.Combine(_root, "seed");
            Repository.Init(seed);
            using var repo = new Repository(seed);
            File.WriteAllText(Path.Combine(seed, "README.md"), "readme");
            Commands.Stage(repo, "*");
            var sig = new Signature("seed", "seed@example.com", DateTimeOffset.Now);
            var commit = repo.Commit("Initial commit", sig, sig);
            if (repo.Branches["main"] == null)
            {
                repo.CreateBranch("main", commit);
            }

            repo.Network.Remotes.Add("origin", _remote);
            repo.Network.Push(repo.Network.Remotes["origin"], "refs/heads/main:refs/heads/main");
            using var bare = new Repository(_remote);
            bare.Refs.UpdateTarget("HEAD", "refs/heads/main");
        }

        private void WriteSiteFile(string relativePath, string contents)
        {
            var path = Path.Combine(_site, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            File.WriteAllText(path, contents);
        }

        private Dictionary<string, string> RemoteFiles(string branch)
        {
            using var bare = new Repository(_remote);
            var tip = bare.Branches[branch]?.Tip ?? throw new InvalidOperationException($"Remote has no branch {branch}.");

            return Walk(tip.Tree, "").ToDictionary(e => e.Path, e => e.Contents);

            static IEnumerable<(string Path, string Contents)> Walk(Tree tree, string prefix)
            {
                foreach (var entry in tree)
                {
                    var path = prefix + entry.Name;
                    if (entry.TargetType == TreeEntryTargetType.Tree)
                    {
                        foreach (var child in Walk((Tree)entry.Target, path + "/")) yield return child;
                    }
                    else
                    {
                        yield return (path, ((Blob)entry.Target).GetContentText());
                    }
                }
            }
        }

        [Fact]
        public async Task FirstDeploy_ClonesRemoteCommitsSiteAndPushes()
        {
            SeedRemote();
            WriteSiteFile("index.html", "home");
            WriteSiteFile("about/index.html", "about");

            var result = await NewDeployer("main").DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Exception?.ToString() ?? result.Message);
            var files = RemoteFiles("main");
            Assert.Equal("home", files["index.html"]);
            Assert.Equal("about", files["about/index.html"]);
            Assert.Equal("readme", files["README.md"]);
            Assert.True(Repository.IsValid(_site), "the output folder is now a clone, ready for the next deploy");
        }

        [Fact]
        public async Task SecondDeploy_PushesChangesAndDeletions()
        {
            SeedRemote();
            WriteSiteFile("index.html", "v1");
            WriteSiteFile("old.html", "old");
            Assert.True((await NewDeployer("main").DeployWholeSite(_site)).WasSuccessful);

            WriteSiteFile("index.html", "v2");
            File.Delete(Path.Combine(_site, "old.html"));
            var result = await NewDeployer("main").DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Exception?.ToString() ?? result.Message);
            var files = RemoteFiles("main");
            Assert.Equal("v2", files["index.html"]);
            Assert.False(files.ContainsKey("old.html"));
        }

        [Fact]
        public async Task DeployToNewBranch_CreatesAndPushesThatBranch()
        {
            SeedRemote();
            WriteSiteFile("index.html", "pages");

            var result = await NewDeployer("gh-pages").DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Exception?.ToString() ?? result.Message);
            Assert.Equal("pages", RemoteFiles("gh-pages")["index.html"]);
            Assert.False(RemoteFiles("main").ContainsKey("index.html"), "main is left alone");
        }

        [Fact]
        public async Task FirstDeploy_ToEmptyRemote_PushesSite()
        {
            WriteSiteFile("index.html", "home");

            var result = await NewDeployer("main").DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Exception?.ToString() ?? result.Message);
            Assert.Equal("home", RemoteFiles("main")["index.html"]);
        }

        [Fact]
        public async Task UnreachableRemote_ReturnsErrorAndKeepsGeneratedFiles()
        {
            WriteSiteFile("index.html", "home");
            var deployer = new GitDeployer(new Dictionary<string, string>
            {
                [GitDeployerDefinition.FieldNames.RemoteUrl] = Path.Combine(_root, "does-not-exist.git"),
                [GitDeployerDefinition.FieldNames.Email] = "a@example.com",
                [GitDeployerDefinition.FieldNames.Username] = "a",
                [GitDeployerDefinition.FieldNames.Password] = "b",
                [GitDeployerDefinition.FieldNames.Branch] = "main",
            });

            var result = await deployer.DeployWholeSite(_site);

            Assert.False(result.WasSuccessful);
            Assert.NotNull(result.Exception);
            Assert.Equal("home", File.ReadAllText(Path.Combine(_site, "index.html")));
        }
    }
}
