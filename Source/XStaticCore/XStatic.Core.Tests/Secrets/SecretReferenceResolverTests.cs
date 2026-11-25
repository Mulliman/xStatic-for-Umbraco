using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;
using XStatic.Core.Secrets;
using Xunit;

namespace XStatic.Core.Tests.Secrets
{
    public class SecretReferenceResolverTests
    {
        /// <summary>Reads environment variables from a dictionary so tests don't touch the real process environment.</summary>
        private sealed class TestResolver(IConfiguration configuration, XStaticGlobalSettings settings, Dictionary<string, string> environment)
            : SecretReferenceResolver(configuration, Options.Create(settings), NullLogger<SecretReferenceResolver>.Instance)
        {
            protected override string GetEnvironmentVariable(string name)
                => environment.TryGetValue(name, out var value) ? value : null!;
        }

        private static TestResolver Resolver(
            Dictionary<string, string>? environment = null,
            Dictionary<string, string?>? configuration = null,
            XStaticSecretSettings? secrets = null)
        {
            var config = new ConfigurationBuilder().AddInMemoryCollection(configuration ?? new()).Build();
            var settings = new XStaticGlobalSettings { Secrets = secrets ?? new XStaticSecretSettings() };

            return new TestResolver(config, settings, environment ?? new());
        }

        [Fact]
        public void Resolve_ReadsAllowedEnvironmentVariable()
        {
            var resolver = Resolver(new() { ["XSTATIC_NETLIFY_TOKEN"] = "real-token" });

            Assert.Equal("real-token", resolver.Resolve("${env:XSTATIC_NETLIFY_TOKEN}"));
        }

        [Fact]
        public void Resolve_ReplacesReferencesInsideAValue()
        {
            var resolver = Resolver(new() { ["XSTATIC_GIT_USER"] = "sam", ["XSTATIC_GIT_TOKEN"] = "t0k" });

            Assert.Equal("https://sam:t0k@github.com/org/repo.git",
                resolver.Resolve("https://${env:XSTATIC_GIT_USER}:${env:XSTATIC_GIT_TOKEN}@github.com/org/repo.git"));
        }

        [Fact]
        public void Resolve_ByDefault_BlocksEnvironmentVariablesWithoutTheXStaticPrefix()
        {
            var resolver = Resolver(new() { ["AZURE_CLIENT_SECRET"] = "should-not-leak" });

            var ex = Assert.Throws<SecretReferenceException>(() => resolver.Resolve("${env:AZURE_CLIENT_SECRET}", "FTP.Pss"));

            Assert.Contains("AZURE_CLIENT_SECRET", ex.Message);
            Assert.Contains("FTP.Pss", ex.Message);
            Assert.Contains("XStatic:Secrets:AllowedEnvironmentVariables", ex.Message);
            Assert.DoesNotContain("should-not-leak", ex.Message);
        }

        [Fact]
        public void Resolve_ByDefault_BlocksConfigurationOutsideXStaticSecrets()
        {
            var resolver = Resolver(configuration: new() { ["ConnectionStrings:umbracoDbDSN"] = "Server=secret" });

            var ex = Assert.Throws<SecretReferenceException>(() => resolver.Resolve("${config:ConnectionStrings:umbracoDbDSN}"));

            Assert.Contains("XStatic:Secrets:AllowedConfigurationKeys", ex.Message);
            Assert.DoesNotContain("Server=secret", ex.Message);
        }

        [Fact]
        public void Resolve_ReadsAllowedConfigurationKey()
        {
            var resolver = Resolver(configuration: new() { ["XStatic:Secrets:NetlifyToken"] = "from-config" });

            Assert.Equal("from-config", resolver.Resolve("${config:XStatic:Secrets:NetlifyToken}"));
        }

        [Fact]
        public void Resolve_WithWildcardAllowList_ReadsAnyEnvironmentVariable()
        {
            var secrets = new XStaticSecretSettings { AllowedEnvironmentVariables = new List<string> { "*" } };
            var resolver = Resolver(new() { ["NETLIFY_AUTH_TOKEN"] = "opened-up" }, secrets: secrets);

            Assert.Equal("opened-up", resolver.Resolve("${env:NETLIFY_AUTH_TOKEN}"));
        }

        [Fact]
        public void Resolve_ConfiguredPatternsReplaceTheDefaults()
        {
            var secrets = new XStaticSecretSettings { AllowedEnvironmentVariables = new List<string> { "NETLIFY_*" } };
            var resolver = Resolver(new() { ["XSTATIC_TOKEN"] = "x", ["NETLIFY_TOKEN"] = "n" }, secrets: secrets);

            Assert.Equal("n", resolver.Resolve("${env:NETLIFY_TOKEN}"));
            Assert.Throws<SecretReferenceException>(() => resolver.Resolve("${env:XSTATIC_TOKEN}"));
        }

        [Fact]
        public void Resolve_MissingVariable_ThrowsNamingIt()
        {
            var resolver = Resolver();

            var ex = Assert.Throws<SecretReferenceException>(() => resolver.Resolve("${env:XSTATIC_MISSING}"));

            Assert.Contains("XSTATIC_MISSING", ex.Message);
            Assert.Contains("isn't set", ex.Message);
        }

        [Fact]
        public void Resolve_IsSinglePass_AndDoesNotResolveReferencesInsideResolvedValues()
        {
            var resolver = Resolver(new()
            {
                ["XSTATIC_OUTER"] = "${env:UNALLOWED_INNER}",
                ["UNALLOWED_INNER"] = "should-not-leak",
            });

            var resolved = resolver.Resolve("${env:XSTATIC_OUTER}");

            Assert.Equal("${env:UNALLOWED_INNER}", resolved);
            Assert.DoesNotContain("should-not-leak", resolved);
        }

        [Fact]
        public void Resolve_MissingConfigurationKey_ThrowsNamingIt()
        {
            var resolver = Resolver();

            var ex = Assert.Throws<SecretReferenceException>(() => resolver.Resolve("${config:XStatic:Secrets:Missing}", "Netlify.PAT"));

            Assert.Contains("XStatic:Secrets:Missing", ex.Message);
            Assert.Contains("Netlify.PAT", ex.Message);
            Assert.Contains("has no value", ex.Message);
        }

        [Fact]
        public void Settings_AllowSecretEnvironmentVariablesBuilder_ReplacesTheDefaults()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());

            services.AddXStatic().AllowSecretEnvironmentVariables("NETLIFY_*", "GIT_*");

            using var provider = services.BuildServiceProvider();
            var secrets = provider.GetRequiredService<IOptions<XStaticGlobalSettings>>().Value.Secrets;

            Assert.Equal(new[] { "NETLIFY_*", "GIT_*" }, secrets.GetEffectiveAllowedEnvironmentVariables());
            Assert.Equal(XStaticSecretSettings.DefaultAllowedConfigurationKeys, secrets.GetEffectiveAllowedConfigurationKeys());
        }

        [Fact]
        public void Settings_EmptyAllowList_FallsBackToTheDefaults()
        {
            var secrets = new XStaticSecretSettings { AllowedEnvironmentVariables = [], AllowedConfigurationKeys = [] };
            var resolver = Resolver(new() { ["XSTATIC_TOKEN"] = "x", ["OTHER_TOKEN"] = "o" }, secrets: secrets);

            Assert.Equal(XStaticSecretSettings.DefaultAllowedEnvironmentVariables, secrets.GetEffectiveAllowedEnvironmentVariables());
            Assert.Equal(XStaticSecretSettings.DefaultAllowedConfigurationKeys, secrets.GetEffectiveAllowedConfigurationKeys());
            Assert.Equal("x", resolver.Resolve("${env:XSTATIC_TOKEN}"));
            Assert.Throws<SecretReferenceException>(() => resolver.Resolve("${env:OTHER_TOKEN}"));
        }

        [Fact]
        public void Resolve_ValuesWithoutReferencesAreUntouched()
        {
            var resolver = Resolver();

            Assert.Equal("plain-password", resolver.Resolve("plain-password"));
            Assert.Null(resolver.Resolve((string)null!));
            Assert.Equal("${env:LITERAL}", resolver.Resolve("$${env:LITERAL}"));
        }

        [Fact]
        public void Resolve_Dictionary_ReturnsANewDictionaryAndLeavesTheStoredOneAlone()
        {
            var resolver = Resolver(new() { ["XSTATIC_TOKEN"] = "real" });
            var stored = new Dictionary<string, string> { ["Netlify.PAT"] = "${env:XSTATIC_TOKEN}", ["Netlify.SiteId"] = "abc" };

            var resolved = resolver.Resolve(stored);

            Assert.NotSame(stored, resolved);
            Assert.Equal("real", resolved["Netlify.PAT"]);
            Assert.Equal("abc", resolved["Netlify.SiteId"]);
            Assert.Equal("${env:XSTATIC_TOKEN}", stored["Netlify.PAT"]);
            Assert.Null(resolver.Resolve((Dictionary<string, string>)null!));
        }

        [Fact]
        public void Settings_BindFromAppSettingsAndBuilder()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["XStatic:Secrets:AllowedEnvironmentVariables:0"] = "NETLIFY_*",
                ["XStatic:Secrets:AllowedEnvironmentVariables:1"] = "GIT_*",
            }).Build());

            services.AddXStatic().AllowSecretConfigurationKeys("Deploy:*");

            using var provider = services.BuildServiceProvider();
            var secrets = provider.GetRequiredService<IOptions<XStaticGlobalSettings>>().Value.Secrets;

            Assert.Equal(new[] { "NETLIFY_*", "GIT_*" }, secrets.GetEffectiveAllowedEnvironmentVariables());
            Assert.Equal(new[] { "Deploy:*" }, secrets.GetEffectiveAllowedConfigurationKeys());
        }

        [Fact]
        public void Settings_DefaultToXStaticOnlyNames()
        {
            var secrets = new XStaticSecretSettings();

            Assert.Equal(new[] { "XSTATIC_*" }, secrets.GetEffectiveAllowedEnvironmentVariables());
            Assert.Equal(new[] { "XStatic:Secrets:*" }, secrets.GetEffectiveAllowedConfigurationKeys());
        }

        [Fact]
        public void DeployerService_PassesResolvedConfigToTheDeployer()
        {
            Dictionary<string, string>? received = null;
            var service = new DeployerService(
                new() { ["test"] = p => { received = p; return Mock.Of<IDeployer>(); } },
                new(),
                Resolver(new() { ["XSTATIC_TOKEN"] = "real" }));

            service.GetDeployer("test", new() { ["Token"] = "${env:XSTATIC_TOKEN}" });

            Assert.Equal("real", received!["Token"]);
        }

        [Fact]
        public void DeployServiceBuilder_RegistersAResolvingDeployerService()
        {
            Dictionary<string, string>? received = null;
            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["XStatic:Secrets:Token"] = "from-config",
            }).Build());
            services.AddLogging();

            var builder = services.AddXStatic();
            builder.DeployServiceBuilder.AddDeployer(
                Mock.Of<IDeployerDefinition>(d => d.Id == "test"),
                p => { received = p; return Mock.Of<IDeployer>(); });
            builder.DeployServiceBuilder.Build();

            using var provider = services.BuildServiceProvider();
            provider.GetRequiredService<IDeployerService>().GetDeployer("test", new() { ["Token"] = "${config:XStatic:Secrets:Token}" });

            Assert.Equal("from-config", received!["Token"]);
        }

        [Fact]
        public async Task DeployProcess_UnresolvableReference_ReturnsAnErrorResultInsteadOfThrowing()
        {
            var output = Directory.CreateTempSubdirectory("xstatic-secret-test-");

            try
            {
                var storer = new Mock<IStaticSiteStorer>();
                storer.Setup(s => s.GetStorageLocationOfSite(7)).Returns(output.FullName);

                var sites = new Mock<ISitesRepository>();
                sites.Setup(s => s.Get<SiteConfig>(7)).Returns(new SiteConfig { Id = 7, DeploymentTarget = 3 });

                var targets = new Mock<IDeploymentTargetRepository>();
                targets.Setup(t => t.Get(3)).Returns(new DeploymentTargetDataModel
                {
                    Id = 3,
                    DeployerDefinition = "test",
                    Config = new() { ["Token"] = "${env:NOT_ALLOWED}" },
                });

                var deployers = new DeployerService(
                    new() { ["test"] = _ => throw new InvalidOperationException("The deployer must not be created.") },
                    new(),
                    Resolver());

                var result = await new DeployProcess(storer.Object, targets.Object, deployers, sites.Object).DeployStaticSite(7);

                Assert.False(result.WasSuccessful);
                Assert.Contains("NOT_ALLOWED", result.Message);
            }
            finally
            {
                output.Delete(true);
            }
        }

        [Fact]
        public void ConfiguredPostGenerationAction_ResolvesConfigWhenRead()
        {
            var resolver = Resolver(new() { ["XSTATIC_WEBHOOK"] = "https://hooks.example/secret" });
            var stored = new Dictionary<string, string> { ["Url"] = "${env:XSTATIC_WEBHOOK}" };

            var action = new ConfiguredPostGenerationAction(Mock.Of<IPostGenerationAction>(), stored, resolver);

            Assert.Equal("https://hooks.example/secret", action.Config["Url"]);
            Assert.Same(stored, action.RawConfig);
        }

        [Fact]
        public void ConfiguredPostGenerationAction_UnresolvableReference_ThrowsOnlyWhenConfigIsRead()
        {
            var action = new ConfiguredPostGenerationAction(
                Mock.Of<IPostGenerationAction>(),
                new Dictionary<string, string> { ["Url"] = "${env:NOT_ALLOWED}" },
                Resolver());

            Assert.Throws<SecretReferenceException>(() => action.Config);
        }

        public class NoOpAction : IPostGenerationAction
        {
            public string Name => "No-op";

            public Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
                => Task.FromResult(XStaticResult.Success());
        }

        [Fact]
        public void ActionFactory_FromDependencyInjection_ResolvesActionConfig()
        {
            var services = new ServiceCollection();
            services.AddSingleton<IConfiguration>(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["XStatic:Secrets:Webhook"] = "https://hooks.example/secret",
            }).Build());
            services.AddLogging();

            services.AddXStatic().GeneratorServiceBuilder.AddDefaultActionServices();

            var repo = new Mock<IActionRepository>();
            repo.Setup(r => r.Get(5)).Returns(new XStatic.Core.Actions.Db.ActionDataModel
            {
                Id = 5,
                Type = typeof(NoOpAction).AssemblyQualifiedName,
                Config = new() { ["Url"] = "${config:XStatic:Secrets:Webhook}" },
            });
            services.AddSingleton(repo.Object);

            using var provider = services.BuildServiceProvider();
            var action = provider.GetRequiredService<IActionFactory>().CreateConfiguredPostGenerationAction(5);

            Assert.Equal("https://hooks.example/secret", action.Config["Url"]);
        }

        [Fact]
        public void ConfiguredPostGenerationAction_WithoutResolver_KeepsStoredConfig()
        {
            var stored = new Dictionary<string, string> { ["Url"] = "${env:XSTATIC_WEBHOOK}" };

            var action = new ConfiguredPostGenerationAction(Mock.Of<IPostGenerationAction>(), stored);

            Assert.Same(stored, action.Config);
        }
    }
}
