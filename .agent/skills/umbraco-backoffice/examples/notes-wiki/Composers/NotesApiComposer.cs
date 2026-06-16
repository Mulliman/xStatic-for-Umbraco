using Asp.Versioning;
using Microsoft.AspNetCore.Mvc.ApiExplorer;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Api.Common.OpenApi;
using NotesWiki.Services;

namespace NotesWiki.Composers;

/// <summary>
/// Composer that configures the Notes Wiki API services and Swagger documentation.
/// </summary>
public class NotesApiComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        // Register our services
        builder.Services.AddSingleton<INotesService, NotesService>();

        // Configure custom operation ID handler for nicer Swagger operation names
        builder.Services.AddSingleton<IOperationIdHandler, NotesOperationHandler>();

        // Configure Swagger
        builder.Services.Configure<SwaggerGenOptions>(opt =>
        {
            // Add a custom Swagger document for the Notes Wiki API
            // This will be available at /umbraco/swagger/noteswiki/swagger.json
            opt.SwaggerDoc(Constants.ApiName, new OpenApiInfo
            {
                Title = "Notes Wiki Backoffice API",
                Version = "1.0",
                Description = "API for the Notes Wiki Umbraco extension"
            });

            // Enable Umbraco authentication for the Notes Wiki Swagger document
            opt.OperationFilter<NotesOperationSecurityFilter>();
        });
    }

    /// <summary>
    /// Security filter that enables Umbraco backoffice authentication for API endpoints.
    /// </summary>
    public class NotesOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => Constants.ApiName;
    }

    /// <summary>
    /// Custom operation ID handler for cleaner Swagger operation names.
    /// This generates operation IDs based on the action name instead of verbose defaults.
    /// </summary>
    public class NotesOperationHandler : OperationIdHandler
    {
        public NotesOperationHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
            : base(apiVersioningOptions)
        {
        }

        protected override bool CanHandle(ApiDescription apiDescription, ControllerActionDescriptor controllerActionDescriptor)
        {
            return controllerActionDescriptor.ControllerTypeInfo.Namespace?.StartsWith(
                "NotesWiki.Controllers",
                StringComparison.InvariantCultureIgnoreCase) is true;
        }

        public override string Handle(ApiDescription apiDescription)
        {
            return $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
        }
    }
}
