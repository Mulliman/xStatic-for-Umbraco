using System;
using System.Text.Json;
using XStatic.Core.Models;
using Xunit;

namespace XStatic.Core.Tests.Models
{
    public class SafeExceptionJsonConverterTests
    {
        [Fact]
        public void XStaticResult_WithThrownException_SerializesWithoutMethodBaseError()
        {
            Exception thrown;
            try
            {
                throw new XStaticException("Cloudflare Pages API returned 403 Forbidden.");
            }
            catch (Exception ex)
            {
                thrown = ex;
            }

            Assert.NotNull(thrown.TargetSite);

            var result = XStaticResult.Error(thrown.Message, thrown);
            var json = JsonSerializer.Serialize(result);

            using var doc = JsonDocument.Parse(json);
            Assert.False(doc.RootElement.GetProperty("WasSuccessful").GetBoolean());
            Assert.Equal("Cloudflare Pages API returned 403 Forbidden.", doc.RootElement.GetProperty("Message").GetString());
            var exNode = doc.RootElement.GetProperty("Exception");
            Assert.Equal("Cloudflare Pages API returned 403 Forbidden.", exNode.GetProperty("message").GetString());
            Assert.Equal(typeof(XStaticException).FullName, exNode.GetProperty("type").GetString());
        }

        [Fact]
        public void GenericXStaticResult_WithThrownException_SerializesWithoutMethodBaseError()
        {
            Exception thrown;
            try
            {
                throw new XStaticException("Project name already taken.");
            }
            catch (Exception ex)
            {
                thrown = ex;
            }

            var result = XStaticResult<string>.Error(thrown.Message, thrown);
            var json = JsonSerializer.Serialize(result);

            using var doc = JsonDocument.Parse(json);
            Assert.False(doc.RootElement.GetProperty("WasSuccessful").GetBoolean());
            Assert.Equal("Project name already taken.", doc.RootElement.GetProperty("Message").GetString());
            Assert.Equal("Project name already taken.", doc.RootElement.GetProperty("Exception").GetProperty("message").GetString());
        }
    }
}
