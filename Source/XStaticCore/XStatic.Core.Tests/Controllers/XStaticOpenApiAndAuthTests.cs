using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using OpenIddict.Validation.AspNetCore;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using Umbraco.Cms.Api.Common.Attributes;
using XStatic.Controllers;
using XStatic.Controllers.Attributes;
using XStatic.Controllers.OpenApi;
using XStatic.Core.App;
using XStatic.Security;
using Xunit;

namespace XStatic.Core.Tests.Controllers;

public class XStaticOpenApiAndAuthTests
{
    /// <summary>
    /// The xStatic authorization policy each controller must use. A newly added controller fails
    /// <see cref="DiscoveredControllers_MatchTheExpectedAuthorizationMap"/> until it is listed here.
    /// </summary>
    private static readonly IReadOnlyDictionary<Type, string> ExpectedPolicies = new Dictionary<Type, string>
    {
        [typeof(DeploymentTargetController)] = XStaticRoles.XStaticAdminGroup,
        [typeof(ActionsController)] = XStaticRoles.XStaticAdminGroup,
        [typeof(SitesController)] = XStaticRoles.XStaticNormalUserGroup,
        [typeof(GenerateController)] = XStaticRoles.XStaticNormalUserGroup,
        [typeof(DeployController)] = XStaticRoles.XStaticNormalUserGroup,
        [typeof(DownloadController)] = XStaticRoles.XStaticNormalUserGroup,
        [typeof(XStaticConfigController)] = XStaticRoles.XStaticNormalUserGroup,
    };

    private static readonly Type[] AllXStaticControllers = typeof(SitesController).Assembly
        .GetTypes()
        .Where(t => t is { IsClass: true, IsAbstract: false, IsPublic: true } && typeof(ControllerBase).IsAssignableFrom(t))
        .OrderBy(t => t.FullName, StringComparer.Ordinal)
        .ToArray();

    public static TheoryData<Type> Controllers()
    {
        var data = new TheoryData<Type>();
        foreach (var controller in AllXStaticControllers)
        {
            data.Add(controller);
        }

        return data;
    }

    [Fact]
    public void DiscoveredControllers_MatchTheExpectedAuthorizationMap()
    {
        Assert.Equal(
            ExpectedPolicies.Keys.Select(t => t.FullName).OrderBy(n => n, StringComparer.Ordinal),
            AllXStaticControllers.Select(t => t.FullName));
    }

    [Theory]
    [MemberData(nameof(Controllers))]
    public void Controller_IsMappedToXStaticV1Api_WithTheExpectedAuthorization(Type controller)
    {
        var mapToApi = controller.GetCustomAttribute<MapToApiAttribute>();
        Assert.NotNull(mapToApi);
        Assert.Equal(XStaticOpenApiOperationTransformer.ApiName, mapToApi!.ApiName);

        Assert.True(ExpectedPolicies.TryGetValue(controller, out var expectedPolicy),
            $"{controller.Name} has no expected authorization policy; add it to {nameof(ExpectedPolicies)}.");

        // Only attributes declared on the controller itself: base classes such as ManagementApiControllerBase add
        // Umbraco's own [Authorize], which isn't the xStatic role check.
        var xstaticAuthorize = controller.GetCustomAttributes<AuthorizeAttribute>(inherit: false)
            .Where(a => a.Policy is XStaticRoles.XStaticAdminGroup or XStaticRoles.XStaticNormalUserGroup)
            .ToList();

        var authorize = Assert.Single(xstaticAuthorize);
        Assert.Equal(expectedPolicy, authorize.Policy);

        if (expectedPolicy == XStaticRoles.XStaticAdminGroup)
        {
            Assert.IsType<AuthorizeAdminAttribute>(authorize);
        }
        else
        {
            // [AuthorizeNormalUser] or the equivalent [Authorize(XStaticRoles.XStaticNormalUserGroup)].
            Assert.False(authorize is AuthorizeAdminAttribute, $"{controller.Name} must not require the admin group.");
        }
    }

    [Theory]
    [InlineData(typeof(DeploymentTargetController))]
    [InlineData(typeof(ActionsController))]
    public void SecretHoldingControllers_AreNeverCached(Type controller)
    {
        var responseCache = controller.GetCustomAttribute<ResponseCacheAttribute>();

        Assert.NotNull(responseCache);
        Assert.True(responseCache!.NoStore, $"{controller.Name} must set [ResponseCache(NoStore = true)].");
        Assert.Equal(ResponseCacheLocation.None, responseCache.Location);
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
    public async System.Threading.Tasks.Task OpenApiOperationTransformer_PopulatesMetadata_ForXStaticEndpointsOnly()
    {
        var transformer = new XStaticOpenApiOperationTransformer();
        var method = typeof(SitesController).GetMethod(nameof(SitesController.GetById))!;

        var xstaticOperation = new OpenApiOperation { Responses = new OpenApiResponses() };
        await transformer.TransformAsync(xstaticOperation, CreateContext(XStaticOpenApiOperationTransformer.ApiName, method), default);

        Assert.Equal("Sites_GetById", xstaticOperation.OperationId);
        Assert.False(string.IsNullOrWhiteSpace(xstaticOperation.Summary));
        Assert.False(string.IsNullOrWhiteSpace(xstaticOperation.Description));
        Assert.True(xstaticOperation.Responses.ContainsKey("401"));
        Assert.True(xstaticOperation.Responses.ContainsKey("403"));

        var otherOperation = new OpenApiOperation { Responses = new OpenApiResponses() };
        await transformer.TransformAsync(otherOperation, CreateContext("management", method), default);

        Assert.Null(otherOperation.OperationId);
        Assert.Empty(otherOperation.Responses);
    }

    private static OpenApiOperationTransformerContext CreateContext(string documentName, MethodInfo method)
    {
        var actionDescriptor = new ControllerActionDescriptor
        {
            ControllerName = method.DeclaringType!.Name.Replace("Controller", string.Empty),
            ActionName = method.Name,
            MethodInfo = method,
            ControllerTypeInfo = method.DeclaringType.GetTypeInfo(),
            EndpointMetadata = method.GetCustomAttributes(inherit: true).ToList(),
        };

        return new OpenApiOperationTransformerContext
        {
            DocumentName = documentName,
            Description = new ApiDescription { GroupName = documentName, ActionDescriptor = actionDescriptor },
            ApplicationServices = null!,
        };
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
        Assert.Contains(Umbraco.Cms.Core.Constants.Security.BackOfficeAuthenticationType, adminPolicy.AuthenticationSchemes);
        Assert.Contains(Umbraco.Cms.Core.Constants.Security.BackOfficeAuthenticationType, normalPolicy.AuthenticationSchemes);

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
