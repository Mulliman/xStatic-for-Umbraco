using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using XStatic.Ftp;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    /// <summary>
    /// Runs the real FTP deployer against a real FTP server in the test process. See Testing.md for checking against
    /// a Docker FTP server as well.
    /// </summary>
    public sealed class FtpDeployerServerTests : IAsyncLifetime, IDisposable
    {
        private FtpTestServer _server = null!;
        private readonly string _site = Path.Combine(Path.GetTempPath(), "xstatic-ftp-site-" + Guid.NewGuid().ToString("N"));

        public async Task InitializeAsync()
        {
            _server = await FtpTestServer.StartAsync();

            Directory.CreateDirectory(Path.Combine(_site, "css"));
            Directory.CreateDirectory(Path.Combine(_site, "about", "team"));
            File.WriteAllText(Path.Combine(_site, "index.html"), "<h1>Home</h1>");
            File.WriteAllText(Path.Combine(_site, "css", "site.css"), "body { color: red; }");
            File.WriteAllText(Path.Combine(_site, "about", "team", "index.html"), "<h1>Team</h1>");
        }

        public async Task DisposeAsync() => await _server.DisposeAsync();

        public void Dispose()
        {
            try
            {
                if (Directory.Exists(_site)) Directory.Delete(_site, recursive: true);
            }
            catch (Exception e) when (e is IOException or UnauthorizedAccessException)
            {
                // Still open on Windows after a failed transfer; it's in the temp folder, so leave it.
            }
        }

        private static FtpDeployer NewDeployer(int port, string folder = "/site", string password = FtpTestServer.Password)
            => new(new Dictionary<string, string>
            {
                [FtpDeployerDefinition.FieldNames.Hostname] = "127.0.0.1",
                [FtpDeployerDefinition.FieldNames.Port] = port.ToString(),
                [FtpDeployerDefinition.FieldNames.Username] = FtpTestServer.Username,
                [FtpDeployerDefinition.FieldNames.Password] = password,
                [FtpDeployerDefinition.FieldNames.Folder] = folder,
            });

        private string Remote(params string[] parts) => Path.Combine(new[] { _server.Root }.Concat(parts).ToArray());

        [Fact]
        public async Task DeployWholeSite_UploadsEveryFileWithItsContent()
        {
            var result = await NewDeployer(_server.Port).DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Equal("<h1>Home</h1>", File.ReadAllText(Remote("site", "index.html")));
            Assert.Equal("body { color: red; }", File.ReadAllText(Remote("site", "css", "site.css")));
            Assert.Equal("<h1>Team</h1>", File.ReadAllText(Remote("site", "about", "team", "index.html")));
        }

        [Fact]
        public async Task DeployWholeSite_ReplacesChangedFilesAndRemovesOldOnes()
        {
            Directory.CreateDirectory(Remote("site"));
            File.WriteAllText(Remote("site", "index.html"), "old home page");
            File.WriteAllText(Remote("site", "deleted-page.html"), "no longer in the site");

            var result = await NewDeployer(_server.Port).DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Equal("<h1>Home</h1>", File.ReadAllText(Remote("site", "index.html")));
            // The deployer mirrors the site, so files that aren't in the generated site are deleted from the server.
            Assert.False(File.Exists(Remote("site", "deleted-page.html")));
        }

        [Fact]
        public async Task DeployWholeSite_NoFolder_DeploysToTheRoot()
        {
            var result = await NewDeployer(_server.Port, folder: "").DeployWholeSite(_site);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.True(File.Exists(Remote("index.html")));
        }

        [Fact]
        public async Task DeployWholeSite_DataConnectionBlocked_ReportsFailureInsteadOfSuccess()
        {
            using var proxy = new BlockedDataPortProxy(_server.Port);

            var result = await NewDeployer(proxy.Port).DeployWholeSite(_site);

            Assert.False(result.WasSuccessful, "a deploy that uploaded nothing must not report success");
            Assert.Contains("FTP deploy failed", result.Message);
            Assert.False(File.Exists(Remote("site", "index.html")));
        }

        [Fact]
        public async Task DeployWholeSite_WrongPassword_ReportsError()
        {
            var result = await NewDeployer(_server.Port, password: "wrong").DeployWholeSite(_site);

            Assert.False(result.WasSuccessful);
            Assert.NotNull(result.Exception);
        }

        [Fact]
        public async Task DeployWholeSite_NoServer_ReportsError()
        {
            var result = await NewDeployer(FtpTestServer.FreePort()).DeployWholeSite(_site);

            Assert.False(result.WasSuccessful);
            Assert.NotNull(result.Exception);
        }
    }
}
