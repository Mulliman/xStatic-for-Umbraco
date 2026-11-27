using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;
using XStatic.Controllers.Attributes;

namespace XStatic.Controllers.Swagger
{
    /// <summary>
    /// Populates clean OpenAPI operation IDs, summaries, descriptions, and standard auth responses
    /// for all endpoints in the <c>xstatic-v1</c> Management API document.
    /// </summary>
    public class XStaticOpenApiOperationFilter : IOperationFilter
    {
        public const string ApiName = "xstatic-v1";

        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var documentName = !string.IsNullOrWhiteSpace(context.DocumentName)
                ? context.DocumentName
                : context.ApiDescription.GroupName;
            if (!string.Equals(documentName, ApiName, System.StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var methodInfo = context.MethodInfo;
            if (methodInfo == null)
            {
                return;
            }

            var operationId = methodInfo.GetCustomAttribute<XStaticOperationIdAttribute>()?.OperationId;
            if (!string.IsNullOrWhiteSpace(operationId))
            {
                operation.OperationId = operationId;
            }
            else if (string.IsNullOrWhiteSpace(operation.OperationId))
            {
                var controllerName = methodInfo.DeclaringType?.Name.Replace("Controller", string.Empty) ?? "XStatic";
                operation.OperationId = $"{controllerName}_{methodInfo.Name}";
            }

            var summary = methodInfo.GetCustomAttribute<EndpointSummaryAttribute>()?.Summary;
            if (!string.IsNullOrWhiteSpace(summary) && string.IsNullOrWhiteSpace(operation.Summary))
            {
                operation.Summary = summary;
            }

            var description = methodInfo.GetCustomAttribute<EndpointDescriptionAttribute>()?.Description;
            if (!string.IsNullOrWhiteSpace(description) && string.IsNullOrWhiteSpace(operation.Description))
            {
                operation.Description = description;
            }

            if (operation.Responses != null)
            {
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
            }
        }
    }
}
