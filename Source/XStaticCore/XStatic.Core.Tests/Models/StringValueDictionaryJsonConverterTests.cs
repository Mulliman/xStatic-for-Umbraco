using System.Text.Json;
using XStatic.Core.Models;
using Xunit;

namespace XStatic.Core.Tests.Models
{
    public class StringValueDictionaryJsonConverterTests
    {
        [Fact]
        public void ActionUpdateModel_DeserializesBooleansNumbersStringsAndNulls()
        {
            const string json = """
            {
                "id": 3,
                "name": "Cloudflare Headers",
                "type": "XStatic.Cloudflare.Actions.CloudflareHeadersAction, XStatic.Cloudflare",
                "config": {
                    "IncludeMarkdownForAgents": true,
                    "DisabledFlag": false,
                    "MaxChunkSize": 1000,
                    "Threshold": 0.75,
                    "CustomRules": "/*\n  X-Test: 1",
                    "Optional": null
                }
            }
            """;

            var model = JsonSerializer.Deserialize<ActionUpdateModel>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            Assert.NotNull(model);
            Assert.NotNull(model.Config);
            Assert.Equal("true", model.Config["IncludeMarkdownForAgents"]);
            Assert.Equal("false", model.Config["DisabledFlag"]);
            Assert.Equal("1000", model.Config["MaxChunkSize"]);
            Assert.Equal("0.75", model.Config["Threshold"]);
            Assert.Equal("/*\n  X-Test: 1", model.Config["CustomRules"]);
            Assert.Null(model.Config["Optional"]);
        }

        [Fact]
        public void DeploymentTargetUpdateModel_DeserializesBooleanToggleField()
        {
            const string json = """
            {
                "id": 0,
                "name": "CF Pages",
                "deployerDefinition": "cloudflare-pages",
                "fields": {
                    "CloudflarePages.AccountId": "acc-123",
                    "CloudflarePages.EnableMarkdownHeaders": true
                }
            }
            """;

            var model = JsonSerializer.Deserialize<DeploymentTargetUpdateModel>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            Assert.NotNull(model);
            Assert.Equal("acc-123", model.Fields["CloudflarePages.AccountId"]);
            Assert.Equal("true", model.Fields["CloudflarePages.EnableMarkdownHeaders"]);
        }
    }
}
