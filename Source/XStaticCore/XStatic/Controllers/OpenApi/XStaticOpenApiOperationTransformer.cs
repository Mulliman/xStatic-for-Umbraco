using Microsoft.AspNetCore.Http.Metadata;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.AspNetCore.Routing;
using Microsoft.OpenApi;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace XStatic.Controllers.OpenApi
{
    /// <summary>
    /// Populates clean OpenAPI operation IDs, summaries, descriptions, and standard auth responses
    /// for all endpoints in the <c>xstatic-v1</c> Management API document.
    /// </summary>
    public class XStaticOpenApiOperationTransformer : IOpenApiOperationTransformer
    {
        public const string ApiName = "xstatic-v1";

        public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
        {
            if (!string.Equals(context.DocumentName, ApiName, StringComparison.OrdinalIgnoreCase))
            {
                return Task.CompletedTask;
            }

            var metadata = context.Description.ActionDescriptor.EndpointMetadata;
            var action = context.Description.ActionDescriptor as ControllerActionDescriptor;

            var endpointName = metadata.OfType<IEndpointNameMetadata>().LastOrDefault()?.EndpointName;
            if (!string.IsNullOrWhiteSpace(endpointName))
            {
                operation.OperationId = endpointName;
            }
            else if (string.IsNullOrWhiteSpace(operation.OperationId) && action != null)
            {
                operation.OperationId = $"{action.ControllerName}_{action.ActionName}";
            }

            var summary = metadata.OfType<IEndpointSummaryMetadata>().LastOrDefault()?.Summary;
            if (!string.IsNullOrWhiteSpace(summary) && string.IsNullOrWhiteSpace(operation.Summary))
            {
                operation.Summary = summary;
            }

            var description = metadata.OfType<IEndpointDescriptionMetadata>().LastOrDefault()?.Description;
            if (!string.IsNullOrWhiteSpace(description) && string.IsNullOrWhiteSpace(operation.Description))
            {
                operation.Description = description;
            }

            operation.Responses ??= new OpenApiResponses();

            if (!operation.Responses.ContainsKey("401"))
            {
                operation.Responses["401"] = new OpenApiResponse
                {
                    Description = "The resource is protected and requires a valid Umbraco BackOffice or API User bearer token."
                };
            }

            if (!operation.Responses.ContainsKey("403"))
            {
                operation.Responses["403"] = new OpenApiResponse
                {
                    Description = "The authenticated user or API user lacks the required xStatic user group (xStaticNormalUser or xStaticAdmin)."
                };
            }

            return Task.CompletedTask;
        }
    }
}
