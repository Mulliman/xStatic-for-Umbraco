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
            options.SwaggerDoc("xstatic-v1", new OpenApiInfo { Title = "xStatic v1", Version = "1.0" });
            options.OperationFilter<XStaticBackOfficeSecurityRequirementsOperationFilter>();
        }
    }
}

