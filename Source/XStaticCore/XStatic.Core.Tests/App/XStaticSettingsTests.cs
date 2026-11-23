using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using XStatic.Core.App;
using Xunit;

namespace XStatic.Core.Tests.App
{
    public class XStaticSettingsTests
    {
        private static XStaticGlobalSettings Resolve(IDictionary<string, string?> config, System.Action<XStaticServiceBuilder>? configure = null)
        {
            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().AddInMemoryCollection(config).Build());

            var builder = services.AddXStatic();
            configure?.Invoke(builder);

            using var provider = services.BuildServiceProvider();
            return provider.GetRequiredService<IOptions<XStaticGlobalSettings>>().Value;
        }

        [Fact]
        public void DoNotDeletePaths_BindsFromAppSettings()
        {
            var settings = Resolve(new Dictionary<string, string?>
            {
                ["XStatic:DoNotDeletePaths:0"] = ".git",
                ["XStatic:DoNotDeletePaths:1"] = ".well-known",
            });

            Assert.Equal(new[] { ".git", ".well-known" }, settings.DoNotDeletePaths);
        }

        [Fact]
        public void DoNotDeletePaths_DefaultsToEmpty()
        {
            Assert.Empty(Resolve(new Dictionary<string, string?>()).DoNotDeletePaths);
        }

        [Fact]
        public void DoNotDeletePathsWhenClearing_SetsPathsInCode()
        {
            var settings = Resolve(new Dictionary<string, string?>(), b => b.DoNotDeletePathsWhenClearing("CNAME", "_redirects"));

            Assert.Equal(new[] { "CNAME", "_redirects" }, settings.DoNotDeletePaths);
        }

        [Fact]
        public void ExcludeGeneratingDocTypes_BindsFromAppSettings()
        {
            var settings = Resolve(new Dictionary<string, string?> { ["XStatic:ExcludeGeneratingDocTypes:0"] = "redirectPage" });

            Assert.Equal(new[] { "redirectPage" }, settings.ExcludeGeneratingDocTypes);
        }
    }
}
