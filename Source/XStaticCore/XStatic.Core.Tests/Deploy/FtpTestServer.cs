using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using FubarDev.FtpServer;
using FubarDev.FtpServer.AccountManagement;
using FubarDev.FtpServer.FileSystem.DotNet;
using Microsoft.Extensions.DependencyInjection;

namespace XStatic.Core.Tests.Deploy
{
    /// <summary>
    /// A real FTP server (FubarDev.FtpServer) on a free loopback port, serving a temp folder. Runs in the test process,
    /// so it needs no Docker and works on the Windows CI runners.
    /// </summary>
    public sealed class FtpTestServer : IAsyncDisposable
    {
        public const string Username = "xstest";
        public const string Password = "xstestpw";

        private readonly ServiceProvider _services;
        private readonly IFtpServerHost _host;

        public int Port { get; }

        /// <summary>The folder the FTP root maps to.</summary>
        public string Root { get; }

        private FtpTestServer(ServiceProvider services, IFtpServerHost host, int port, string root)
        {
            _services = services;
            _host = host;
            Port = port;
            Root = root;
        }

        public static async Task<FtpTestServer> StartAsync()
        {
            var root = Path.Combine(Path.GetTempPath(), "xstatic-ftp-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);
            var port = FreePort();

            var services = new ServiceCollection();
            services.Configure<DotNetFileSystemOptions>(o => o.RootPath = root);
            services.Configure<FtpServerOptions>(o =>
            {
                o.ServerAddress = IPAddress.Loopback.ToString();
                o.Port = port;
            });
            services.Configure<SimplePasvOptions>(o => o.PublicAddress = IPAddress.Loopback);
            services.AddFtpServer(builder => builder.UseDotNetFileSystem());
            services.AddSingleton<IMembershipProvider, TestMembershipProvider>();

            var provider = services.BuildServiceProvider();
            var host = provider.GetRequiredService<IFtpServerHost>();
            await host.StartAsync(CancellationToken.None);

            return new FtpTestServer(provider, host, port, root);
        }

        public async ValueTask DisposeAsync()
        {
            await _host.StopAsync(CancellationToken.None);
            await _services.DisposeAsync();
            try
            {
                Directory.Delete(Root, recursive: true);
            }
            catch (IOException)
            {
                // A file the server still has open; it's in the temp folder, so leave it.
            }
        }

        public static int FreePort()
        {
            var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            var port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }

        private sealed class TestMembershipProvider : IMembershipProvider
        {
            public Task<MemberValidationResult> ValidateUserAsync(string username, string password)
            {
                if (username == Username && password == Password)
                {
                    var user = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, username) }, "test"));
                    return Task.FromResult(new MemberValidationResult(MemberValidationStatus.AuthenticatedUser, user));
                }

                return Task.FromResult(new MemberValidationResult(MemberValidationStatus.InvalidLogin));
            }
        }
    }

    /// <summary>
    /// Sits in front of an FTP server's control port and rewrites its passive-mode replies (EPSV 229 and PASV 227) to
    /// a port nothing listens on. That's what a client sees when the server's passive data ports are blocked by a
    /// firewall, or not published from a Docker container: logging in and creating folders work, file transfers don't.
    /// </summary>
    public sealed class BlockedDataPortProxy : IDisposable
    {
        private static readonly Regex Epsv = new(@"\(\|\|\|\d+\|\)");
        private static readonly Regex Pasv = new(@"\(\d+,\d+,\d+,\d+,\d+,\d+\)");

        private readonly TcpListener _listener;
        private readonly int _serverPort;
        private readonly int _deadPort = FtpTestServer.FreePort();
        private readonly CancellationTokenSource _stop = new();

        public int Port { get; }

        public BlockedDataPortProxy(int serverPort)
        {
            _serverPort = serverPort;
            _listener = new TcpListener(IPAddress.Loopback, 0);
            _listener.Start();
            Port = ((IPEndPoint)_listener.LocalEndpoint).Port;
            _ = AcceptAsync();
        }

        private async Task AcceptAsync()
        {
            try
            {
                while (!_stop.IsCancellationRequested)
                {
                    var client = await _listener.AcceptTcpClientAsync(_stop.Token);
                    _ = RelayAsync(client);
                }
            }
            catch (Exception) when (_stop.IsCancellationRequested)
            {
            }
        }

        private async Task RelayAsync(TcpClient client)
        {
            using (client)
            using (var server = new TcpClient())
            {
                await server.ConnectAsync(IPAddress.Loopback, _serverPort);
                var toServer = client.GetStream().CopyToAsync(server.GetStream(), _stop.Token);
                var toClient = RewriteRepliesAsync(server.GetStream(), client.GetStream());
                await Task.WhenAny(toServer, toClient);
            }
        }

        private async Task RewriteRepliesAsync(Stream from, Stream to)
        {
            using var reader = new StreamReader(from, Encoding.ASCII);
            try
            {
                string? line;
                while ((line = await reader.ReadLineAsync(_stop.Token)) != null)
                {
                    if (line.StartsWith("229"))
                    {
                        line = Epsv.Replace(line, $"(|||{_deadPort}|)");
                    }
                    else if (line.StartsWith("227"))
                    {
                        line = Pasv.Replace(line, $"(127,0,0,1,{_deadPort / 256},{_deadPort % 256})");
                    }

                    var bytes = Encoding.ASCII.GetBytes(line + "\r\n");
                    await to.WriteAsync(bytes, _stop.Token);
                }
            }
            catch (Exception) when (_stop.IsCancellationRequested)
            {
            }
            catch (IOException)
            {
            }
        }

        public void Dispose()
        {
            _stop.Cancel();
            _listener.Stop();
        }
    }
}
