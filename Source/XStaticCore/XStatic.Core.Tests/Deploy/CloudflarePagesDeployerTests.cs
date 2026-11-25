using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using XStatic.Cloudflare;
using XStatic.Cloudflare.Actions;
using XStatic.Core;
using XStatic.Core.Actions;
using XStatic.Core.Actions.Db;
using XStatic.Core.Generator.Storage;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class CloudflarePagesDeployerTests : IDisposable
    {
        private readonly string _tempDir;

        public CloudflarePagesDeployerTests()
        {
            _tempDir = Path.Combine(Path.GetTempPath(), "xstatic-cf-pages-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempDir);
        }

        public void Dispose()
        {
            try { Directory.Delete(_tempDir, recursive: true); } catch { /* best effort */ }
        }

        [Fact]
        public async Task DeployWholeSite_UploadsMissingAssetsAndCreatesDeploymentWithManifestAndMarkdownHeaders()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Hello Cloudflare</h1>");
            Directory.CreateDirectory(Path.Combine(_tempDir, "docs"));
            File.WriteAllText(Path.Combine(_tempDir, "docs", "guide.md"), "# Guide");
            // Special Cloudflare Pages files that must not be published in the static asset manifest
            File.WriteAllText(Path.Combine(_tempDir, "_routes.json"), "{\"version\":1}");
            File.WriteAllText(Path.Combine(_tempDir, "_worker.js"), "export default {}");

            var requests = new List<(HttpMethod Method, string Url, string Auth, string Body)>();
            var handler = new StubHttpMessageHandler(async req =>
            {
                var body = req.Content != null ? await req.Content.ReadAsStringAsync() : string.Empty;
                requests.Add((req.Method, req.RequestUri!.ToString(), req.Headers.Authorization?.ToString() ?? string.Empty, body));

                var path = req.RequestUri.AbsolutePath;
                if (path.EndsWith("/upload-token"))
                {
                    return JsonResponse(new { success = true, result = new { jwt = "test-upload-jwt" } });
                }

                if (path.EndsWith("/pages/assets/check-missing"))
                {
                    using var doc = JsonDocument.Parse(body);
                    var hashes = doc.RootElement.GetProperty("hashes").EnumerateArray().Select(e => e.GetString()).ToList();
                    return JsonResponse(new { success = true, result = hashes });
                }

                if (path.EndsWith("/pages/assets/upload") || path.EndsWith("/pages/assets/upsert-hashes"))
                {
                    return JsonResponse(new { success = true, result = true });
                }

                if (path.EndsWith("/deployments"))
                {
                    return JsonResponse(new { success = true, result = new { id = "dep-123", url = "https://abc.my-site.pages.dev" } });
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            using var httpClient = new HttpClient(handler);
            var parameters = new Dictionary<string, string>
            {
                [CloudflarePagesDeployerDefinition.FieldNames.AccountId] = "acc-123",
                [CloudflarePagesDeployerDefinition.FieldNames.ApiToken] = "api-token-secret",
                [CloudflarePagesDeployerDefinition.FieldNames.ProjectName] = "my-site",
                [CloudflarePagesDeployerDefinition.FieldNames.Branch] = "main",
                [CloudflarePagesDeployerDefinition.FieldNames.EnableMarkdownHeaders] = "true"
            };

            var deployer = new CloudflarePagesDeployer(parameters, httpClient);
            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Contains("https://abc.my-site.pages.dev", result.Message);

            Assert.Equal(5, requests.Count);
            Assert.EndsWith("/accounts/acc-123/pages/projects/my-site/upload-token", requests[0].Url);
            Assert.Equal("Bearer api-token-secret", requests[0].Auth);

            Assert.EndsWith("/pages/assets/check-missing", requests[1].Url);
            Assert.Equal("Bearer test-upload-jwt", requests[1].Auth);

            Assert.EndsWith("/pages/assets/upload", requests[2].Url);
            Assert.Contains("text/markdown; charset=utf-8", requests[2].Body);

            Assert.EndsWith("/pages/assets/upsert-hashes", requests[3].Url);

            Assert.EndsWith("/accounts/acc-123/pages/projects/my-site/deployments", requests[4].Url);
            Assert.Equal("Bearer api-token-secret", requests[4].Auth);
            Assert.Contains("/index.html", requests[4].Body);
            Assert.Contains("/docs/guide.md", requests[4].Body);
            Assert.DoesNotContain("/_routes.json", requests[4].Body);
            Assert.DoesNotContain("/_worker.js", requests[4].Body);
            Assert.Contains("Vary: Accept", requests[4].Body);
            Assert.Contains("name=branch", requests[4].Body);
        }

        [Fact]
        public async Task DeployWholeSite_PreservesExistingHeadersAndRedirectsAndUploadsOnlyMissingHashes()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Home</h1>");
            File.WriteAllText(Path.Combine(_tempDir, "about.html"), "<h1>About</h1>");
            File.WriteAllText(Path.Combine(_tempDir, "_headers"), "/*\n  X-Custom: keep-me\n");
            File.WriteAllText(Path.Combine(_tempDir, "_redirects"), "/old /new 301\n");

            var indexHash = CloudflarePagesDeployer.ComputeAssetHash(File.ReadAllBytes(Path.Combine(_tempDir, "index.html")), "html");
            var aboutHash = CloudflarePagesDeployer.ComputeAssetHash(File.ReadAllBytes(Path.Combine(_tempDir, "about.html")), "html");

            string? uploadBody = null;
            string? deploymentBody = null;

            var handler = new StubHttpMessageHandler(async req =>
            {
                var body = req.Content != null ? await req.Content.ReadAsStringAsync() : string.Empty;
                var path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith("/upload-token"))
                {
                    return JsonResponse(new { success = true, result = new { jwt = "jwt-partial" } });
                }

                if (path.EndsWith("/check-missing"))
                {
                    // Report only about.html as missing
                    return JsonResponse(new { success = true, result = new[] { aboutHash } });
                }

                if (path.EndsWith("/pages/assets/upload"))
                {
                    uploadBody = body;
                    return JsonResponse(new { success = true, result = true });
                }

                if (path.EndsWith("/upsert-hashes"))
                {
                    return JsonResponse(new { success = true, result = true });
                }

                if (path.EndsWith("/deployments"))
                {
                    deploymentBody = body;
                    return JsonResponse(new { success = true, result = new { id = "dep-3", url = "https://partial.pages.dev" } });
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflarePagesDeployer(new Dictionary<string, string>
            {
                [CloudflarePagesDeployerDefinition.FieldNames.AccountId] = "acc-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ApiToken] = "tok-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ProjectName] = "proj-1",
                [CloudflarePagesDeployerDefinition.FieldNames.EnableMarkdownHeaders] = "true"
            }, httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.NotNull(uploadBody);
            Assert.Contains(aboutHash, uploadBody);
            Assert.DoesNotContain(indexHash, uploadBody);

            Assert.NotNull(deploymentBody);
            Assert.Contains("X-Custom: keep-me", deploymentBody);
            Assert.DoesNotContain("Vary: Accept", deploymentBody); // Existing _headers was not overwritten
            Assert.Contains("/old /new 301", deploymentBody);
        }

        [Fact]
        public async Task DeployWholeSite_RefreshesJwtOnUnauthorizedDuringUpload()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Retry JWT</h1>");
            var tokenCalls = 0;
            var uploadCalls = 0;

            var handler = new StubHttpMessageHandler(async req =>
            {
                var body = req.Content != null ? await req.Content.ReadAsStringAsync() : string.Empty;
                var path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith("/upload-token"))
                {
                    tokenCalls++;
                    return JsonResponse(new { success = true, result = new { jwt = $"jwt-{tokenCalls}" } });
                }

                if (path.EndsWith("/check-missing"))
                {
                    using var doc = JsonDocument.Parse(body);
                    var hashes = doc.RootElement.GetProperty("hashes").EnumerateArray().Select(e => e.GetString()).ToList();
                    return JsonResponse(new { success = true, result = hashes });
                }

                if (path.EndsWith("/pages/assets/upload"))
                {
                    uploadCalls++;
                    if (uploadCalls == 1)
                    {
                        return new HttpResponseMessage(HttpStatusCode.Unauthorized)
                        {
                            Content = new StringContent("{\"success\":false}")
                        };
                    }

                    Assert.Equal("Bearer jwt-2", req.Headers.Authorization?.ToString());
                    return JsonResponse(new { success = true, result = true });
                }

                if (path.EndsWith("/upsert-hashes"))
                {
                    Assert.Equal("Bearer jwt-2", req.Headers.Authorization?.ToString());
                    return JsonResponse(new { success = true, result = true });
                }

                if (path.EndsWith("/deployments"))
                {
                    return JsonResponse(new { success = true, result = new { id = "dep-jwt", url = "https://jwt.pages.dev" } });
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflarePagesDeployer(new Dictionary<string, string>
            {
                [CloudflarePagesDeployerDefinition.FieldNames.AccountId] = "acc-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ApiToken] = "tok-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ProjectName] = "proj-1"
            }, httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Equal(2, tokenCalls);
            Assert.Equal(2, uploadCalls);
        }

        [Fact]
        public async Task DeployWholeSite_WhenApiReturnsHttp200WithSuccessFalse_ReturnsError()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Fail</h1>");

            var handler = new StubHttpMessageHandler(_ =>
                Task.FromResult(JsonResponse(new { success = false, errors = new[] { new { message = "Invalid token" } } })));

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflarePagesDeployer(new Dictionary<string, string>
            {
                [CloudflarePagesDeployerDefinition.FieldNames.AccountId] = "acc-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ApiToken] = "tok-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ProjectName] = "proj-1"
            }, httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.False(result.WasSuccessful);
            Assert.Contains("proj-1", result.Message);
        }

        [Fact]
        public async Task DeployWholeSite_SkipsAssetUploadWhenNothingIsMissing()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Cached</h1>");

            var urls = new List<string>();
            var trackingHandler = new StubHttpMessageHandler(req =>
            {
                urls.Add(req.RequestUri!.AbsolutePath);
                var path = req.RequestUri.AbsolutePath;
                if (path.EndsWith("/upload-token"))
                {
                    return Task.FromResult(JsonResponse(new { success = true, result = new { jwt = "jwt-1" } }));
                }
                if (path.EndsWith("/check-missing"))
                {
                    return Task.FromResult(JsonResponse(new { success = true, result = Array.Empty<string>() }));
                }
                if (path.EndsWith("/upsert-hashes"))
                {
                    return Task.FromResult(JsonResponse(new { success = true, result = true }));
                }
                if (path.EndsWith("/deployments"))
                {
                    return Task.FromResult(JsonResponse(new { success = true, result = new { id = "dep-2", url = "https://cached.pages.dev" } }));
                }
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
            });

            using var httpClient = new HttpClient(trackingHandler);
            var parameters = new Dictionary<string, string>
            {
                [CloudflarePagesDeployerDefinition.FieldNames.AccountId] = "acc-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ApiToken] = "tok-1",
                [CloudflarePagesDeployerDefinition.FieldNames.ProjectName] = "proj-1"
            };

            var deployer = new CloudflarePagesDeployer(parameters, httpClient);
            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful);
            Assert.DoesNotContain(urls, u => u.EndsWith("/pages/assets/upload"));
        }

        [Fact]
        public async Task DeployWholeSite_WhenMissingRequiredParameters_ReturnsError()
        {
            var deployer = new CloudflarePagesDeployer(new Dictionary<string, string>());
            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.False(result.WasSuccessful);
            Assert.Contains("Account ID", result.Message);
        }

        [Fact]
        public async Task DeploymentTargetCreator_CreatesCloudflarePagesProjectAndReturnsTargetModel()
        {
            string? capturedBody = null;
            var handler = new StubHttpMessageHandler(async req =>
            {
                capturedBody = await req.Content!.ReadAsStringAsync();
                return JsonResponse(new { success = true, result = new { name = "new-xstatic-site" } });
            });

            using var httpClient = new HttpClient(handler);
            var creator = new CloudflarePagesDeploymentTargetCreator(new Dictionary<string, string>
            {
                [CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.AccountId] = "acc-99",
                [CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.ApiToken] = "tok-99",
                [CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.ProjectName] = "new-xstatic-site",
                [CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.ProductionBranch] = "production"
            }, httpClient);

            var target = await creator.CreateTarget();

            Assert.Equal("new-xstatic-site", target.Name);
            Assert.Equal(CloudflarePagesDeployer.DeployerKey, target.DeployerDefinition);
            Assert.Equal("acc-99", target.Fields[CloudflarePagesDeployerDefinition.FieldNames.AccountId]);
            Assert.Equal("production", target.Fields[CloudflarePagesDeployerDefinition.FieldNames.Branch]);
            Assert.Contains("\"production_branch\":\"production\"", capturedBody);
        }

        [Fact]
        public async Task CloudflareHeadersAndRedirectsActions_StoreFilesViaSiteStorer()
        {
            var storer = new Mock<IStaticSiteStorer>();
            string? storedHeaders = null;
            string? storedRedirects = null;

            storer.Setup(s => s.StoreSiteItem("7", CloudflareHeadersAction.HeadersFilePath, It.IsAny<string>(), It.IsAny<Encoding>()))
                .Callback<string, string, string, Encoding>((_, _, content, _) => storedHeaders = content)
                .ReturnsAsync("/_headers");

            storer.Setup(s => s.StoreSiteItem("7", CloudflareRedirectsAction.RedirectsFilePath, It.IsAny<string>(), It.IsAny<Encoding>()))
                .Callback<string, string, string, Encoding>((_, _, content, _) => storedRedirects = content)
                .ReturnsAsync("/_redirects");

            var headersAction = new CloudflareHeadersAction(storer.Object);
            var headersResult = await headersAction.RunAction(7, new Dictionary<string, string>
            {
                [CloudflareHeadersFields.IncludeMarkdownForAgents] = "true",
                [CloudflareHeadersFields.CustomRules] = "/assets/*\n  Cache-Control: public, max-age=31536000"
            });

            Assert.True(headersResult.WasSuccessful);
            Assert.NotNull(storedHeaders);
            Assert.Contains("Vary: Accept", storedHeaders);
            Assert.Contains("Cache-Control: public, max-age=31536000", storedHeaders);

            var redirectsAction = new CloudflareRedirectsAction(storer.Object);
            var redirectsResult = await redirectsAction.RunAction(7, new Dictionary<string, string>
            {
                [CloudflareRedirectsFields.Rules] = "/old-page /new-page 301"
            });

            Assert.True(redirectsResult.WasSuccessful);
            Assert.Equal("/old-page /new-page 301\n", storedRedirects);
        }

        [Fact]
        public void ActionFactory_CanCreateCloudflareHeadersActionViaDiWithoutExplicitActionRegistration()
        {
            var services = new ServiceCollection();
            services.AddSingleton(Mock.Of<IStaticSiteStorer>());
            using var provider = services.BuildServiceProvider();

            var factory = new ActionFactory(Mock.Of<IActionRepository>(), provider);
            var action = factory.CreatePostGenerationAction(new ActionDataModel
            {
                Name = "Cloudflare Headers",
                Type = typeof(CloudflareHeadersAction).AssemblyQualifiedName
            });

            Assert.IsType<CloudflareHeadersAction>(action);
        }

        private static HttpResponseMessage JsonResponse(object payload)
        {
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
        }

        private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> responder) : HttpMessageHandler
        {
            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return responder(request);
            }
        }
    }
}
