using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using XStatic.RemoteOperations;
using Xunit;

namespace XStatic.Core.Tests.RemoteOperations
{
    public class TokenRetrieverTests
    {
        private const string BaseUri = "https://cms.example.com";
        private const string Secret = "s3cr&t+val=ue";

        /// <summary>Records each request body and answers with the next canned response.</summary>
        private sealed class FakeHandler : HttpMessageHandler
        {
            private readonly Queue<string> _responses = new();

            public List<string> RequestBodies { get; } = new();

            public List<Uri?> RequestUris { get; } = new();

            public void Enqueue(string body) => _responses.Enqueue(body);

            protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                RequestUris.Add(request.RequestUri);
                RequestBodies.Add(request.Content == null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken));

                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(_responses.Count > 0 ? _responses.Dequeue() : "{}", Encoding.UTF8, "application/json"),
                };
            }
        }

        private static string TokenJson(string token, int expiresIn = 300) => $"{{\"access_token\":\"{token}\",\"expires_in\":{expiresIn}}}";

        private static (TokenRetriever Retriever, FakeHandler Handler) NewRetriever()
        {
            var handler = new FakeHandler();
            return (new TokenRetriever(BaseUri, new HttpClient(handler)), handler);
        }

        [Fact]
        public async Task GetAccessToken_PostsFormEncodedCredentialsToTheTokenEndpoint()
        {
            var (retriever, handler) = NewRetriever();
            handler.Enqueue(TokenJson("abc"));

            var token = await retriever.GetAccessToken("client&id", Secret);

            Assert.Equal("abc", token!.Value);
            Assert.Equal(new Uri(BaseUri + "/umbraco/management/api/v1/security/back-office/token"), handler.RequestUris[0]);
            var body = handler.RequestBodies[0];
            Assert.Contains("client_id=client%26id", body);
            Assert.Contains("client_secret=s3cr%26t%2Bval%3Due", body);
            Assert.Contains("grant_type=client_credentials", body);
        }

        [Fact]
        public async Task GetAccessToken_CachesPerClientId()
        {
            var (retriever, handler) = NewRetriever();
            handler.Enqueue(TokenJson("token-a"));
            handler.Enqueue(TokenJson("token-b"));

            var a1 = await retriever.GetAccessToken("client-a", Secret);
            var b1 = await retriever.GetAccessToken("client-b", Secret);
            var a2 = await retriever.GetAccessToken("client-a", Secret);
            var b2 = await retriever.GetAccessToken("client-b", Secret);

            Assert.Equal("token-a", a1!.Value);
            Assert.Equal("token-b", b1!.Value);
            Assert.Same(a1, a2);
            Assert.Same(b1, b2);
            Assert.Equal(2, handler.RequestBodies.Count);
        }

        [Fact]
        public async Task GetAccessToken_ExpiryIsUtcAndAllowsForLatency()
        {
            var (retriever, handler) = NewRetriever();
            handler.Enqueue(TokenJson("abc", expiresIn: 300));

            var before = DateTime.UtcNow;
            var token = await retriever.GetAccessToken("client", Secret);

            Assert.Equal(DateTimeKind.Utc, token!.Expiry.Kind);
            Assert.InRange(token.Expiry, before.AddSeconds(285), DateTime.UtcNow.AddSeconds(291));
        }

        [Fact]
        public async Task GetAccessToken_ExpiredToken_IsFetchedAgain()
        {
            var (retriever, handler) = NewRetriever();
            // Five seconds is inside the latency allowance, so the token counts as expired straight away.
            handler.Enqueue(TokenJson("short-lived", expiresIn: 5));
            handler.Enqueue(TokenJson("fresh"));

            var first = await retriever.GetAccessToken("client", Secret);
            var second = await retriever.GetAccessToken("client", Secret);

            Assert.Equal("short-lived", first!.Value);
            Assert.Equal("fresh", second!.Value);
            Assert.Equal(2, handler.RequestBodies.Count);
        }

        [Theory]
        [InlineData("not json at all " + Secret)]
        [InlineData("[]")]
        [InlineData("{\"expires_in\":300}")]
        [InlineData("{\"access_token\":\"abc\"}")]
        [InlineData("{\"access_token\":\"abc\",\"expires_in\":\"soon\"}")]
        [InlineData("{\"access_token\":\"abc\",\"expires_in\":0}")]
        public async Task GetAccessToken_MalformedResponse_ThrowsWithoutLeakingSecrets(string responseBody)
        {
            var (retriever, handler) = NewRetriever();
            handler.Enqueue(responseBody);

            var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => retriever.GetAccessToken("client", Secret));

            Assert.StartsWith("GetAccessToken", ex.Message);
            Assert.DoesNotContain(Secret, ex.Message);
            Assert.DoesNotContain("abc", ex.Message);
        }

        [Fact]
        public async Task GetAccessToken_FailedResponseIsNotCached()
        {
            var (retriever, handler) = NewRetriever();
            handler.Enqueue("{}");
            handler.Enqueue(TokenJson("abc"));

            await Assert.ThrowsAsync<InvalidOperationException>(() => retriever.GetAccessToken("client", Secret));
            var token = await retriever.GetAccessToken("client", Secret);

            Assert.Equal("abc", token!.Value);
        }

        [Fact]
        public void Constructor_KeepsTheSingleArgumentOverload()
        {
            var retriever = new TokenRetriever(BaseUri);

            Assert.Equal(BaseUri, retriever.BaseUri);
        }
    }
}
