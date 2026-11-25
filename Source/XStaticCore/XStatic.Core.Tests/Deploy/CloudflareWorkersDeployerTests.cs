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
using XStatic.Cloudflare;
using XStatic.Core;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class CloudflareWorkersDeployerTests : IDisposable
    {
        private readonly string _tempDir;

        public CloudflareWorkersDeployerTests()
        {
            _tempDir = Path.Combine(Path.GetTempPath(), "xstatic-cf-workers-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempDir);
        }

        public void Dispose()
        {
            if (Directory.Exists(_tempDir))
            {
                Directory.Delete(_tempDir, recursive: true);
            }
        }

        [Fact]
        public async Task DeployWholeSite_UploadsMissingBucketsAndUploadsAssetsOnlyWorker()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Hello Workers</h1>");
            Directory.CreateDirectory(Path.Combine(_tempDir, "docs"));
            File.WriteAllText(Path.Combine(_tempDir, "docs", "guide.md"), "# Guide");
            File.WriteAllText(Path.Combine(_tempDir, "_headers"), "/*\n  X-Custom: keep-me\n");
            File.WriteAllText(Path.Combine(_tempDir, "_redirects"), "/old /new 301\n");
            File.WriteAllText(Path.Combine(_tempDir, "_worker.js"), "export default {}");

            var indexHash = Hash("index.html", "html");
            var guideHash = Hash(Path.Combine("docs", "guide.md"), "md");

            var requests = new List<Captured>();
            var handler = new StubHttpMessageHandler(async req =>
            {
                var captured = await Captured.From(req);
                requests.Add(captured);
                var path = req.RequestUri!.AbsolutePath;

                if (path.EndsWith("/assets-upload-session"))
                {
                    return JsonResponse(new { success = true, result = new { jwt = "upload-jwt", buckets = new[] { new[] { indexHash }, new[] { guideHash } } } });
                }

                if (path.EndsWith("/workers/assets/upload"))
                {
                    // Only the final bucket's response carries the completion token.
                    return captured.Body.Contains(guideHash)
                        ? JsonResponse(new { success = true, result = new { jwt = "completion-jwt" } }, HttpStatusCode.Created)
                        : JsonResponse(new { success = true, result = new { } }, HttpStatusCode.Accepted);
                }

                if (path.EndsWith("/workers/scripts/my-site") && req.Method == HttpMethod.Put)
                {
                    return JsonResponse(new { success = true, result = new { id = "my-site" } });
                }

                if (path.EndsWith("/workers/scripts/my-site/subdomain"))
                {
                    return JsonResponse(new { success = true, result = new { enabled = true } });
                }

                if (path.EndsWith("/workers/subdomain"))
                {
                    return JsonResponse(new { success = true, result = new { subdomain = "acme" } });
                }

                return new HttpResponseMessage(HttpStatusCode.NotFound);
            });

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflareWorkersDeployer(new Dictionary<string, string>
            {
                [CloudflareWorkersDeployerDefinition.FieldNames.AccountId] = "acc-123",
                [CloudflareWorkersDeployerDefinition.FieldNames.ApiToken] = "api-token-secret",
                [CloudflareWorkersDeployerDefinition.FieldNames.WorkerName] = "my-site",
                [CloudflareWorkersDeployerDefinition.FieldNames.NotFoundHandling] = "404-page",
                [CloudflareWorkersDeployerDefinition.FieldNames.CompatibilityDate] = "2025-09-01",
                [CloudflareWorkersDeployerDefinition.FieldNames.EnableMarkdownHeaders] = "true"
            }, httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message + result.Exception);
            Assert.Contains("https://my-site.acme.workers.dev", result.Message);
            Assert.Equal(6, requests.Count);

            // 1. Upload session with the full manifest, authenticated with the API token.
            var session = requests[0];
            Assert.Equal(HttpMethod.Post, session.Method);
            Assert.EndsWith("/accounts/acc-123/workers/scripts/my-site/assets-upload-session", session.Path);
            Assert.Equal("Bearer api-token-secret", session.Auth);
            using (var doc = JsonDocument.Parse(session.Body))
            {
                var manifest = doc.RootElement.GetProperty("manifest");
                Assert.Equal(indexHash, manifest.GetProperty("/index.html").GetProperty("hash").GetString());
                Assert.Equal(new FileInfo(Path.Combine(_tempDir, "index.html")).Length, manifest.GetProperty("/index.html").GetProperty("size").GetInt64());
                Assert.True(manifest.TryGetProperty("/docs/guide.md", out _));
                Assert.False(manifest.TryGetProperty("/_headers", out _));
                Assert.False(manifest.TryGetProperty("/_redirects", out _));
                Assert.False(manifest.TryGetProperty("/_worker.js", out _));
            }

            // 2-3. One request per bucket, authenticated with the upload JWT, files as base64 parts named by hash.
            Assert.EndsWith("/accounts/acc-123/workers/assets/upload", requests[1].Path);
            Assert.Equal("?base64=true", requests[1].Query);
            Assert.Equal("Bearer upload-jwt", requests[1].Auth);
            Assert.Contains($"name={indexHash}", requests[1].Body);
            Assert.Contains("text/html; charset=utf-8", requests[1].Body);
            Assert.Contains(Convert.ToBase64String(File.ReadAllBytes(Path.Combine(_tempDir, "index.html"))), requests[1].Body);
            Assert.Contains("text/markdown; charset=utf-8", requests[2].Body);

            // 4. Assets-only Worker: metadata only, with the completion token and the raw _headers/_redirects.
            var put = requests[3];
            Assert.Equal(HttpMethod.Put, put.Method);
            Assert.Equal("Bearer api-token-secret", put.Auth);
            Assert.Contains("name=metadata", put.Body);
            using (var metadata = JsonDocument.Parse(ExtractJson(put.Body)))
            {
                var root = metadata.RootElement;
                Assert.False(root.TryGetProperty("main_module", out _));
                Assert.Equal("2025-09-01", root.GetProperty("compatibility_date").GetString());
                var assets = root.GetProperty("assets");
                Assert.Equal("completion-jwt", assets.GetProperty("jwt").GetString());
                var config = assets.GetProperty("config");
                Assert.Equal("404-page", config.GetProperty("not_found_handling").GetString());
                Assert.False(config.TryGetProperty("html_handling", out _));
                Assert.Equal("/*\n  X-Custom: keep-me\n", config.GetProperty("_headers").GetString()); // existing file wins over markdown defaults
                Assert.Equal("/old /new 301\n", config.GetProperty("_redirects").GetString());
            }

            // 5-6. workers.dev is turned on and the account subdomain read for the URL.
            Assert.EndsWith("/workers/scripts/my-site/subdomain", requests[4].Path);
            Assert.Contains("\"enabled\":true", requests[4].Body);
            Assert.EndsWith("/accounts/acc-123/workers/subdomain", requests[5].Path);
        }

        [Fact]
        public async Task DeployWholeSite_WhenNothingIsMissing_UsesSessionJwtAsCompletionTokenAndAddsMarkdownHeaders()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Cached</h1>");

            var paths = new List<string>();
            string? putBody = null;
            var handler = new StubHttpMessageHandler(async req =>
            {
                paths.Add(req.RequestUri!.AbsolutePath);
                if (req.RequestUri.AbsolutePath.EndsWith("/assets-upload-session"))
                {
                    return JsonResponse(new { success = true, result = new { jwt = "already-complete", buckets = Array.Empty<string[]>() } });
                }

                putBody = await req.Content!.ReadAsStringAsync();
                return JsonResponse(new { success = true, result = new { } });
            });

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflareWorkersDeployer(new Dictionary<string, string>
            {
                [CloudflareWorkersDeployerDefinition.FieldNames.AccountId] = "acc-1",
                [CloudflareWorkersDeployerDefinition.FieldNames.ApiToken] = "tok-1",
                [CloudflareWorkersDeployerDefinition.FieldNames.WorkerName] = "cached",
                [CloudflareWorkersDeployerDefinition.FieldNames.EnableWorkersDev] = "false",
                [CloudflareWorkersDeployerDefinition.FieldNames.EnableMarkdownHeaders] = "true"
            }, httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message + result.Exception);
            Assert.Equal(2, paths.Count);
            Assert.DoesNotContain(paths, p => p.EndsWith("/workers/assets/upload"));
            Assert.DoesNotContain(paths, p => p.EndsWith("/subdomain"));

            using var metadata = JsonDocument.Parse(ExtractJson(putBody!));
            var assets = metadata.RootElement.GetProperty("assets");
            Assert.Equal("already-complete", assets.GetProperty("jwt").GetString());
            Assert.Contains("Vary: Accept", assets.GetProperty("config").GetProperty("_headers").GetString());
            Assert.False(metadata.RootElement.TryGetProperty("compatibility_date", out _));
        }

        [Fact]
        public async Task DeployWholeSite_WhenWorkersDevCannotBeEnabled_StillReportsTheDeploy()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>No subdomain</h1>");

            var handler = new StubHttpMessageHandler(req =>
            {
                var path = req.RequestUri!.AbsolutePath;
                if (path.EndsWith("/assets-upload-session"))
                {
                    return Task.FromResult(JsonResponse(new { success = true, result = new { jwt = "done", buckets = Array.Empty<string[]>() } }));
                }

                if (path.EndsWith("/subdomain"))
                {
                    return Task.FromResult(JsonResponse(new { success = false, errors = new[] { new { code = 10007, message = "workers.dev subdomain not registered" } } }, HttpStatusCode.BadRequest));
                }

                return Task.FromResult(JsonResponse(new { success = true, result = new { } }));
            });

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflareWorkersDeployer(Params("acc-1", "tok-1", "nosub"), httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful);
            Assert.Contains("could not be turned on", result.Message);
            Assert.Contains("not registered", result.Message);
        }

        [Fact]
        public async Task DeployWholeSite_WhenApiReturnsSuccessFalse_ReturnsError()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Fail</h1>");

            var handler = new StubHttpMessageHandler(_ =>
                Task.FromResult(JsonResponse(new { success = false, errors = new[] { new { message = "Invalid token" } } })));

            using var httpClient = new HttpClient(handler);
            var deployer = new CloudflareWorkersDeployer(Params("acc-1", "tok-1", "broken"), httpClient);

            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.False(result.WasSuccessful);
            Assert.Contains("broken", result.Message);
            Assert.Contains("Invalid token", result.Exception?.Message);
        }

        [Fact]
        public async Task DeployWholeSite_RetriesTransientErrors()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<h1>Retry</h1>");
            var sessionCalls = 0;

            var handler = new StubHttpMessageHandler(req =>
            {
                if (req.RequestUri!.AbsolutePath.EndsWith("/assets-upload-session") && ++sessionCalls == 1)
                {
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable) { Content = new StringContent("busy") });
                }

                return Task.FromResult(req.RequestUri.AbsolutePath.EndsWith("/assets-upload-session")
                    ? JsonResponse(new { success = true, result = new { jwt = "done", buckets = Array.Empty<string[]>() } })
                    : JsonResponse(new { success = true, result = new { } }));
            });

            using var httpClient = new HttpClient(handler);
            var parameters = Params("acc-1", "tok-1", "retry");
            parameters[CloudflareWorkersDeployerDefinition.FieldNames.EnableWorkersDev] = "false";
            var result = await new CloudflareWorkersDeployer(parameters, httpClient).DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message + result.Exception);
            Assert.Equal(2, sessionCalls);
        }

        [Theory]
        [InlineData(CloudflareWorkersDeployerDefinition.FieldNames.AccountId, "Account ID")]
        [InlineData(CloudflareWorkersDeployerDefinition.FieldNames.ApiToken, "API Token")]
        [InlineData(CloudflareWorkersDeployerDefinition.FieldNames.WorkerName, "Worker Name")]
        public async Task DeployWholeSite_WhenRequiredFieldIsMissing_ReturnsError(string missingField, string expected)
        {
            var parameters = Params("acc-1", "tok-1", "site");
            parameters.Remove(missingField);

            var result = await new CloudflareWorkersDeployer(parameters).DeployWholeSite(_tempDir);

            Assert.False(result.WasSuccessful);
            Assert.Contains(expected, result.Message);
        }

        [Fact]
        public async Task DeployWholeSite_WhenRoutingOptionIsInvalid_ReturnsErrorWithoutCallingCloudflare()
        {
            var called = false;
            var handler = new StubHttpMessageHandler(_ =>
            {
                called = true;
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
            });

            using var httpClient = new HttpClient(handler);
            var parameters = Params("acc-1", "tok-1", "site");
            parameters[CloudflareWorkersDeployerDefinition.FieldNames.HtmlHandling] = "sometimes";

            var result = await new CloudflareWorkersDeployer(parameters, httpClient).DeployWholeSite(_tempDir);

            Assert.False(result.WasSuccessful);
            Assert.Contains("auto-trailing-slash", result.Message);
            Assert.False(called);
        }

        [Fact]
        public async Task DeploymentTargetCreator_CreatesWorkerWithPlaceholderAndReturnsTargetModel()
        {
            var paths = new List<string>();
            string? manifestBody = null;
            var handler = new StubHttpMessageHandler(async req =>
            {
                var path = req.RequestUri!.AbsolutePath;
                paths.Add(req.Method + " " + path);

                if (path.EndsWith("/settings"))
                {
                    return JsonResponse(new { success = false, errors = new[] { new { code = 10007, message = "workers.api.error.script_not_found" } } }, HttpStatusCode.NotFound);
                }

                if (path.EndsWith("/assets-upload-session"))
                {
                    manifestBody = await req.Content!.ReadAsStringAsync();
                    return JsonResponse(new { success = true, result = new { jwt = "done", buckets = Array.Empty<string[]>() } });
                }

                if (path.EndsWith("/workers/subdomain"))
                {
                    return JsonResponse(new { success = true, result = new { subdomain = "acme" } });
                }

                return JsonResponse(new { success = true, result = new { } });
            });

            using var httpClient = new HttpClient(handler);
            var creator = new CloudflareWorkersDeploymentTargetCreator(new Dictionary<string, string>
            {
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.AccountId] = "acc-99",
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.ApiToken] = "tok-99",
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.WorkerName] = "new-xstatic-site"
            }, httpClient);

            var target = await creator.CreateTarget();

            Assert.Equal("new-xstatic-site", target.Name);
            Assert.Equal(CloudflareWorkersDeployer.DeployerKey, target.DeployerDefinition);
            Assert.Equal("acc-99", target.Fields[CloudflareWorkersDeployerDefinition.FieldNames.AccountId]);
            Assert.Equal("tok-99", target.Fields[CloudflareWorkersDeployerDefinition.FieldNames.ApiToken]);
            Assert.Equal("new-xstatic-site", target.Fields[CloudflareWorkersDeployerDefinition.FieldNames.WorkerName]);
            Assert.Equal("GET /client/v4/accounts/acc-99/workers/scripts/new-xstatic-site/settings", paths[0]);
            Assert.Contains("PUT /client/v4/accounts/acc-99/workers/scripts/new-xstatic-site", paths);
            Assert.Contains("/index.html", manifestBody);
        }

        [Fact]
        public async Task DeploymentTargetCreator_WhenWorkerAlreadyExists_RefusesAndDeploysNothing()
        {
            var paths = new List<string>();
            var handler = new StubHttpMessageHandler(req =>
            {
                paths.Add(req.RequestUri!.AbsolutePath);
                return Task.FromResult(JsonResponse(new { success = true, result = new { } }));
            });

            using var httpClient = new HttpClient(handler);
            var creator = new CloudflareWorkersDeploymentTargetCreator(new Dictionary<string, string>
            {
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.AccountId] = "acc-99",
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.ApiToken] = "tok-99",
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.WorkerName] = "live-site"
            }, httpClient);

            var ex = await Assert.ThrowsAsync<XStaticException>(() => creator.CreateTarget());

            Assert.Contains("already exists", ex.Message);
            Assert.Single(paths);
        }

        [Theory]
        [InlineData("Has-Capitals")]
        [InlineData("-leading-hyphen")]
        [InlineData("under_score")]
        public async Task DeploymentTargetCreator_RejectsInvalidWorkerNames(string name)
        {
            var creator = new CloudflareWorkersDeploymentTargetCreator(new Dictionary<string, string>
            {
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.AccountId] = "acc-99",
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.ApiToken] = "tok-99",
                [CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.WorkerName] = name
            });

            var ex = await Assert.ThrowsAsync<XStaticException>(() => creator.CreateTarget());
            Assert.Contains("Invalid Cloudflare Worker Name", ex.Message);
        }

        private string Hash(string relativePath, string extension)
        {
            return CloudflarePagesDeployer.ComputeAssetHash(File.ReadAllBytes(Path.Combine(_tempDir, relativePath)), extension);
        }

        private static Dictionary<string, string> Params(string accountId, string token, string workerName)
        {
            return new Dictionary<string, string>
            {
                [CloudflareWorkersDeployerDefinition.FieldNames.AccountId] = accountId,
                [CloudflareWorkersDeployerDefinition.FieldNames.ApiToken] = token,
                [CloudflareWorkersDeployerDefinition.FieldNames.WorkerName] = workerName
            };
        }

        private static string ExtractJson(string multipartBody)
        {
            var start = multipartBody.IndexOf('{');
            var end = multipartBody.LastIndexOf('}');
            return multipartBody.Substring(start, end - start + 1);
        }

        private static HttpResponseMessage JsonResponse(object payload, HttpStatusCode status = HttpStatusCode.OK)
        {
            return new HttpResponseMessage(status)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
        }

        private sealed record Captured(HttpMethod Method, string Path, string Query, string Auth, string Body)
        {
            public static async Task<Captured> From(HttpRequestMessage req)
            {
                var body = req.Content != null ? await req.Content.ReadAsStringAsync() : string.Empty;
                return new Captured(req.Method, req.RequestUri!.AbsolutePath, req.RequestUri.Query, req.Headers.Authorization?.ToString() ?? string.Empty, body);
            }
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
