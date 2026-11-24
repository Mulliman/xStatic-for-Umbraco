using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using XStatic.Controllers;
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Deploy.Targets.Db;
using XStatic.Core.Models;
using XStatic.Core.Secrets;
using Xunit;

namespace XStatic.Core.Tests.Controllers;

public class DeploymentTargetControllerTests
{
    private const string DeployerId = "test-deployer";
    private const string TokenReference = "${env:XSTATIC_TEST_TOKEN}";
    private const string RealToken = "real-secret-token";

    /// <summary>Reads environment variables from a dictionary so tests don't touch the real process environment.</summary>
    private sealed class TestResolver(Dictionary<string, string> environment)
        : SecretReferenceResolver(new ConfigurationBuilder().Build(), Options.Create(new XStaticGlobalSettings()), NullLogger<SecretReferenceResolver>.Instance)
    {
        protected override string GetEnvironmentVariable(string name)
            => environment.TryGetValue(name, out var value) ? value : null!;
    }

    private readonly Mock<IDeploymentTargetRepository> _repo = new();
    private readonly Mock<IDeployerService> _deployerService = new();
    private readonly Mock<IDeploymentTargetCreatorService> _creatorService = new();

    public DeploymentTargetControllerTests()
    {
        var definition = new Mock<IDeployerDefinition>();
        definition.SetupGet(d => d.Id).Returns(DeployerId);
        definition.SetupGet(d => d.Help).Returns("help");
        definition.SetupGet(d => d.Fields).Returns(
        [
            new DeployerField { Alias = "Token", Name = "Token" },
            new DeployerField { Alias = "SiteId", Name = "Site ID" },
        ]);

        _deployerService.Setup(s => s.GetDefinitions()).Returns([definition.Object]);
        _repo.Setup(r => r.Create(It.IsAny<DeploymentTargetDataModel>()))
            .Returns((DeploymentTargetDataModel d) => new DeploymentTargetDataModel
            {
                Id = 42,
                Name = d.Name,
                DeployerDefinition = d.DeployerDefinition,
                Config = d.Config,
            });
    }

    private DeploymentTargetController CreateController(Dictionary<string, string>? environment = null)
        => new(_repo.Object, _deployerService.Object, _creatorService.Object,
            new TestResolver(environment ?? new() { ["XSTATIC_TEST_TOKEN"] = RealToken }));

    private static DeploymentTargetCreatorPostModel PostModel(string token = TokenReference) => new()
    {
        Name = "My target",
        Creator = "test-creator",
        Fields = new() { ["Token"] = token, ["SiteName"] = "my-site" },
    };

    [Fact]
    public async Task AutoCreate_ResolvesReferencesForTheCreator_AndSavesTheReferenceNotTheSecret()
    {
        Dictionary<string, string>? creatorFields = null;
        var creator = new Mock<IDeploymentTargetCreator>();
        creator.Setup(c => c.CreateTarget()).ReturnsAsync(() => new DeploymentTargetUpdateModel
        {
            Name = "My target",
            DeployerDefinition = DeployerId,
            // Creators typically copy the token they were given into the target they create.
            Fields = new() { ["Token"] = creatorFields!["Token"], ["SiteId"] = "site-123" },
        });

        _creatorService
            .Setup(s => s.GetDeploymentTargetCreator("test-creator", It.IsAny<Dictionary<string, string>>()))
            .Callback((string _, Dictionary<string, string> fields) => creatorFields = fields)
            .Returns(creator.Object);

        DeploymentTargetDataModel? saved = null;
        _repo.Setup(r => r.Create(It.IsAny<DeploymentTargetDataModel>()))
            .Callback((DeploymentTargetDataModel d) => saved = d)
            .Returns((DeploymentTargetDataModel d) => new DeploymentTargetDataModel
            {
                Id = 42,
                Name = d.Name,
                DeployerDefinition = d.DeployerDefinition,
                Config = d.Config,
            });

        var result = await CreateController().AutoCreateDeploymentTarget(PostModel());

        // The creator received the real value so it could call the remote service.
        Assert.NotNull(creatorFields);
        Assert.Equal(RealToken, creatorFields!["Token"]);

        // The saved target keeps the reference the user typed.
        Assert.NotNull(saved);
        Assert.Equal(TokenReference, saved!.Config["Token"]);
        Assert.Equal("site-123", saved.Config["SiteId"]);
        Assert.DoesNotContain(RealToken, saved.Config.Values);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(201, objectResult.StatusCode);
        var body = Assert.IsType<DeploymentTargetController.AutoCreateDeploymentTargetResult>(objectResult.Value);
        Assert.True(body.WasSuccessful);
        Assert.Equal(42, body.Data.Id);

        var returnedFields = body.Data.Fields.ToDictionary(f => f.Alias, f => f.Value);
        Assert.Equal(TokenReference, returnedFields["Token"]);
        Assert.DoesNotContain(RealToken, returnedFields.Values);
    }

    [Fact]
    public async Task AutoCreate_UnresolvableReference_Returns409_WithoutCallingTheCreatorOrSaving()
    {
        var result = await CreateController().AutoCreateDeploymentTarget(PostModel("${env:NOT_ALLOWED_TOKEN}"));

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(409, objectResult.StatusCode);
        var body = Assert.IsType<DeploymentTargetController.AutoCreateDeploymentTargetResult>(objectResult.Value);
        Assert.False(body.WasSuccessful);
        Assert.IsType<SecretReferenceException>(body.Exception);
        Assert.Contains("NOT_ALLOWED_TOKEN", body.Message);

        _creatorService.Verify(
            s => s.GetDeploymentTargetCreator(It.IsAny<string>(), It.IsAny<Dictionary<string, string>>()),
            Times.Never);
        _repo.Verify(r => r.Create(It.IsAny<DeploymentTargetDataModel>()), Times.Never);
    }
}
