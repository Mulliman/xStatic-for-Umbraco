using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using XStatic.Cloudflare;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class CloudflareR2DeployerTests : IDisposable
    {
        private readonly string _tempDir;

        public CloudflareR2DeployerTests()
        {
            _tempDir = Path.Combine(Path.GetTempPath(), "xstatic-cf-r2-" + Guid.NewGuid().ToString("N"));
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
        public async Task DeployWholeSite_SignsRequestsWithSigV4AndUploadsWithCorrectMimeTypesAndPrefix()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "<html><body>Hi</body></html>");
            Directory.CreateDirectory(Path.Combine(_tempDir, "ai"));
            File.WriteAllText(Path.Combine(_tempDir, "ai", "llms.md"), "# LLMs");

            var captured = new List<(string Url, string? Auth, string? AmzDate, string? ContentType)>();
            var handler = new StubHttpMessageHandler(req =>
            {
                var authHeader = req.Headers.TryGetValues("Authorization", out var authVals) ? authVals.FirstOrDefault() : null;
                var amzDate = req.Headers.TryGetValues("x-amz-date", out var vals) ? vals.FirstOrDefault() : null;
                captured.Add((
                    req.RequestUri!.ToString(),
                    authHeader,
                    amzDate,
                    req.Content?.Headers.ContentType?.ToString()));
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
            });

            var fixedTime = new DateTimeOffset(2026, 11, 21, 12, 0, 0, TimeSpan.Zero);
            using var httpClient = new HttpClient(handler);

            var parameters = new Dictionary<string, string>
            {
                [CloudflareR2DeployerDefinition.FieldNames.AccountId] = "acc-r2",
                [CloudflareR2DeployerDefinition.FieldNames.BucketName] = "static-bucket",
                [CloudflareR2DeployerDefinition.FieldNames.AccessKeyId] = "AKIA_TEST",
                [CloudflareR2DeployerDefinition.FieldNames.SecretAccessKey] = "SECRET_TEST",
                [CloudflareR2DeployerDefinition.FieldNames.KeyPrefix] = "/prod/site/"
            };

            var deployer = new CloudflareR2Deployer(parameters, httpClient, () => fixedTime);
            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful, result.Message);
            Assert.Contains("2 file(s)", result.Message);
            Assert.Equal(2, captured.Count);

            var htmlUpload = captured.Single(c => c.Url.EndsWith("/static-bucket/prod/site/index.html"));
            Assert.StartsWith("https://acc-r2.r2.cloudflarestorage.com/", htmlUpload.Url);
            Assert.Equal("text/html; charset=utf-8", htmlUpload.ContentType);
            Assert.Equal("20261121T120000Z", htmlUpload.AmzDate);
            Assert.StartsWith("AWS4-HMAC-SHA256 Credential=AKIA_TEST/20261121/auto/s3/aws4_request,", htmlUpload.Auth);

            var mdUpload = captured.Single(c => c.Url.EndsWith("/static-bucket/prod/site/ai/llms.md"));
            Assert.Equal("text/markdown; charset=utf-8", mdUpload.ContentType);
        }

        [Fact]
        public async Task DeployWholeSite_UsesEndpointOverrideWhenProvided()
        {
            File.WriteAllText(Path.Combine(_tempDir, "robots.txt"), "User-agent: *");

            string? capturedUrl = null;
            var handler = new StubHttpMessageHandler(req =>
            {
                capturedUrl = req.RequestUri!.ToString();
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
            });

            using var httpClient = new HttpClient(handler);
            var parameters = new Dictionary<string, string>
            {
                [CloudflareR2DeployerDefinition.FieldNames.BucketName] = "eu-bucket",
                [CloudflareR2DeployerDefinition.FieldNames.AccessKeyId] = "KEY",
                [CloudflareR2DeployerDefinition.FieldNames.SecretAccessKey] = "SECRET",
                [CloudflareR2DeployerDefinition.FieldNames.EndpointOverride] = "https://acc-eu.eu.r2.cloudflarestorage.com/"
            };

            var deployer = new CloudflareR2Deployer(parameters, httpClient);
            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.True(result.WasSuccessful);
            Assert.Equal("https://acc-eu.eu.r2.cloudflarestorage.com/eu-bucket/robots.txt", capturedUrl);
        }

        [Fact]
        public async Task DeployWholeSite_WhenR2ReturnsError_ReturnsFailureResult()
        {
            File.WriteAllText(Path.Combine(_tempDir, "index.html"), "test");

            var handler = new StubHttpMessageHandler(_ =>
                Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden)
                {
                    Content = new StringContent("<Error><Code>AccessDenied</Code></Error>")
                }));

            using var httpClient = new HttpClient(handler);
            var parameters = new Dictionary<string, string>
            {
                [CloudflareR2DeployerDefinition.FieldNames.AccountId] = "acc-1",
                [CloudflareR2DeployerDefinition.FieldNames.BucketName] = "bucket-1",
                [CloudflareR2DeployerDefinition.FieldNames.AccessKeyId] = "KEY",
                [CloudflareR2DeployerDefinition.FieldNames.SecretAccessKey] = "SECRET"
            };

            var deployer = new CloudflareR2Deployer(parameters, httpClient);
            var result = await deployer.DeployWholeSite(_tempDir);

            Assert.False(result.WasSuccessful);
            Assert.Contains("bucket-1", result.Message);
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
