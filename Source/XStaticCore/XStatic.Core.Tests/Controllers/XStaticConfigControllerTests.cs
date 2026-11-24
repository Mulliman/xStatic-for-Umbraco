using Microsoft.Extensions.Options;
using Moq;
using XStatic.Controllers;
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Generator.ExportTypes;
using Xunit;

namespace XStatic.Core.Tests.Controllers;

public class XStaticConfigControllerTests
{
    private static XStaticConfigController CreateController(XStaticGlobalSettings? settings)
        => new(
            Mock.Of<IDeployerService>(),
            Mock.Of<IDeploymentTargetCreatorService>(),
            Mock.Of<IExportTypeService>(),
            Mock.Of<IExportTypeRepository>(),
            null!,
            null!,
            null!,
            null!,
            settings == null ? null! : Options.Create(settings));

    [Fact]
    public void GetSettings_ReturnsConfiguredSecretAllowLists()
    {
        var settings = new XStaticGlobalSettings
        {
            UseXStaticUserRoles = true,
            Secrets = new XStaticSecretSettings
            {
                AllowedEnvironmentVariables = ["NETLIFY_*", " GIT_* "],
                AllowedConfigurationKeys = ["Deploy:*"],
            },
        };

        var result = CreateController(settings).GetSettings().Value;

        Assert.NotNull(result);
        Assert.True(result!.IsUsingXStaticRoles);
        Assert.Equal(new[] { "NETLIFY_*", "GIT_*" }, result.AllowedSecretEnvironmentVariables);
        Assert.Equal(new[] { "Deploy:*" }, result.AllowedSecretConfigurationKeys);
    }

    [Fact]
    public void GetSettings_WithoutConfiguredAllowLists_ReturnsTheDefaults()
    {
        var result = CreateController(new XStaticGlobalSettings()).GetSettings().Value;

        Assert.NotNull(result);
        Assert.Equal(XStaticSecretSettings.DefaultAllowedEnvironmentVariables, result!.AllowedSecretEnvironmentVariables);
        Assert.Equal(XStaticSecretSettings.DefaultAllowedConfigurationKeys, result.AllowedSecretConfigurationKeys);
    }

    [Fact]
    public void GetSettings_WithoutOptions_ReturnsTheDefaults()
    {
        var result = CreateController(null).GetSettings().Value;

        Assert.NotNull(result);
        Assert.False(result!.IsUsingXStaticRoles);
        Assert.Equal(XStaticSecretSettings.DefaultAllowedEnvironmentVariables, result.AllowedSecretEnvironmentVariables);
        Assert.Equal(XStaticSecretSettings.DefaultAllowedConfigurationKeys, result.AllowedSecretConfigurationKeys);
    }
}
