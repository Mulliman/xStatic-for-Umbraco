using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace XStatic.Controllers.Swagger
{
    public class XStaticConfigureSwaggerGenOptions : IConfigureOptions<SwaggerGenOptions>
    {
        public void Configure(SwaggerGenOptions options)
        {
            options.SwaggerDoc(XStaticOpenApiOperationFilter.ApiName, new OpenApiInfo
            {
                Title = "xStatic Management API",
                Version = "1.0",
                Description = "Management API for xStatic static site generation and deployment in Umbraco 17+. "
                    + "Supports Umbraco BackOffice and OAuth2 client-credentials API User bearer tokens. "
                    + "When xStatic user roles are enabled, assign API users to the xStaticNormalUser group "
                    + "(sites, generate, deploy, config, download) and xStaticAdmin group (actions, deployment targets)."
            });
            options.OperationFilter<XStaticBackOfficeSecurityRequirementsOperationFilter>();
            options.OperationFilter<XStaticOpenApiOperationFilter>();
        }
    }
}

