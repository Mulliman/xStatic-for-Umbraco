using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using OpenIddict.Validation.AspNetCore;
using Swashbuckle.AspNetCore.SwaggerGen;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Umbraco.Cms.Api.Common.Attributes;
using XStatic.Controllers;
using XStatic.Controllers.Attributes;
using XStatic.Controllers.Swagger;
using XStatic.Core.App;
using XStatic.Security;
using Xunit;

namespace XStatic.Core.Tests.Controllers;

public class XStaticOpenApiAndAuthTests
{
    private static readonly Type[] AllXStaticControllers =
    [
        typeof(SitesController),
        typeof(GenerateController),
        typeof(DeployController),
        typeof(ActionsController),
        typeof(DeploymentTargetController),
        typeof(DownloadController),
        typeof(XStaticConfigController),
    ];

    [Fact]
    public void AllControllers_AreMappedToXStaticV1Api_WithAuthorization()
    {
        foreach (var controller in AllXStaticControllers)
        {
            var mapToApi = controller.GetCustomAttribute<MapToApiAttribute>();
            Assert.NotNull(mapToApi);
            Assert.Equal(XStaticOpenApiOperationFilter.ApiName, mapToApi!.ApiName);

            var authorize = controller.GetCustomAttributes<AuthorizeAttribute>(inherit: true).ToList();
            Assert.NotEmpty(authorize);
        }
    }

    [Fact]
    public void AllControllerActions_HaveUniqueEndpointNames_AndSummariesAndDescriptions()
    {
        var seenOperationIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var controller in AllXStaticControllers)
        {
            var actionMethods = controller
                .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
                .Where(m => m.GetCustomAttributes().Any(a => a is HttpGetAttribute or HttpPostAttribute or HttpDeleteAttribute or HttpPutAttribute))
                .ToList();

            Assert.NotEmpty(actionMethods);

            foreach (var method in actionMethods)
            {
                var endpointName = method.GetCustomAttribute<EndpointNameAttribute>();
                Assert.True(
                    endpointName != null && !string.IsNullOrWhiteSpace(endpointName.EndpointName),
                    $"{controller.Name}.{method.Name} is missing [EndpointName]");
                Assert.True(
                    seenOperationIds.Add(endpointName!.EndpointName),
                    $"Duplicate [EndpointName] '{endpointName.EndpointName}' on {controller.Name}.{method.Name}");

                var summary = method.GetCustomAttribute<EndpointSummaryAttribute>();
                Assert.True(
                    summary != null && !string.IsNullOrWhiteSpace(summary.Summary),
                    $"{controller.Name}.{method.Name} is missing [EndpointSummary]");

                var description = method.GetCustomAttribute<EndpointDescriptionAttribute>();
                Assert.True(
                    description != null && !string.IsNullOrWhiteSpace(description.Description),
                    $"{controller.Name}.{method.Name} is missing [EndpointDescription]");
            }
        }
    }

    [Fact]
    public void OpenApiOperationFilter_PopulatesMetadata_ForXStaticEndpointsOnly()
    {
        var filter = new XStaticOpenApiOperationFilter();
        var method = typeof(SitesController).GetMethod(nameof(SitesController.GetById))!;

        var xstaticOperation = new OpenApiOperation { Responses = new OpenApiResponses() };
        var xstaticContext = new OperationFilterContext(
            new ApiDescription { GroupName = XStaticOpenApiOperationFilter.ApiName },
            null!,
            new SchemaRepository(),
            new OpenApiDocument(),
            method);

        filter.Apply(xstaticOperation, xstaticContext);

        Assert.Equal("Sites_GetById", xstaticOperation.OperationId);
        Assert.False(string.IsNullOrWhiteSpace(xstaticOperation.Summary));
        Assert.False(string.IsNullOrWhiteSpace(xstaticOperation.Description));
        Assert.True(xstaticOperation.Responses.ContainsKey("401"));
        Assert.True(xstaticOperation.Responses.ContainsKey("403"));

        var otherOperation = new OpenApiOperation { Responses = new OpenApiResponses() };
        var otherContext = new OperationFilterContext(
            new ApiDescription { GroupName = "management" },
            null!,
            new SchemaRepository(),
            new OpenApiDocument(),
            method);

        filter.Apply(otherOperation, otherContext);

        Assert.Null(otherOperation.OperationId);
        Assert.Empty(otherOperation.Responses);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void AuthorizationPolicies_SupportOpenIddictApiUsers_AndRespectRoleSetting(bool useXStaticRoles)
    {
        var settings = Options.Create(new XStaticGlobalSettings { UseXStaticUserRoles = useXStaticRoles });
        var authOptions = new AuthorizationOptions();

        new AuthorizeAdminPolicyOptions(settings).Configure(authOptions);
        new AuthorizeNormalUserPolicyOptions(settings).Configure(authOptions);

        var adminPolicy = authOptions.GetPolicy(XStaticRoles.XStaticAdminGroup);
        var normalPolicy = authOptions.GetPolicy(XStaticRoles.XStaticNormalUserGroup);

        Assert.NotNull(adminPolicy);
        Assert.NotNull(normalPolicy);

        Assert.Contains(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme, adminPolicy!.AuthenticationSchemes);
        Assert.Contains(OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme, normalPolicy!.AuthenticationSchemes);

        var adminRoles = adminPolicy.Requirements.OfType<RolesAuthorizationRequirement>().SingleOrDefault();
        var normalRoles = normalPolicy.Requirements.OfType<RolesAuthorizationRequirement>().SingleOrDefault();

        if (useXStaticRoles)
        {
            Assert.NotNull(adminRoles);
            Assert.Contains(XStaticRoles.XStaticAdminGroup, adminRoles!.AllowedRoles);

            Assert.NotNull(normalRoles);
            Assert.Contains(XStaticRoles.XStaticNormalUserGroup, normalRoles!.AllowedRoles);
            Assert.Contains(XStaticRoles.XStaticAdminGroup, normalRoles.AllowedRoles);
        }
        else
        {
            Assert.Null(adminRoles);
            Assert.Null(normalRoles);
        }
    }
}
