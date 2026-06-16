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

namespace TimeDashboard.Composers
{
    public class TimeDashboardApiComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.Services.AddSingleton<IOperationIdHandler, TimeDashboardOperationHandler>();

            builder.Services.Configure<SwaggerGenOptions>(opt =>
            {
                opt.SwaggerDoc(Constants.ApiName, new OpenApiInfo
                {
                    Title = "Time Dashboard API",
                    Version = "1.0",
                    Description = "Time and date endpoints for the Umbraco backoffice"
                });

                opt.OperationFilter<TimeDashboardOperationSecurityFilter>();
            });
        }

        public class TimeDashboardOperationSecurityFilter : BackOfficeSecurityRequirementsOperationFilterBase
        {
            protected override string ApiName => Constants.ApiName;
        }

        public class TimeDashboardOperationHandler : OperationIdHandler
        {
            public TimeDashboardOperationHandler(IOptions<ApiVersioningOptions> apiVersioningOptions)
                : base(apiVersioningOptions)
            {
            }

            protected override bool CanHandle(ApiDescription apiDescription, ControllerActionDescriptor controllerActionDescriptor)
            {
                return controllerActionDescriptor.ControllerTypeInfo.Namespace?
                    .StartsWith("TimeDashboard.Controllers", StringComparison.InvariantCultureIgnoreCase) is true;
            }

            public override string Handle(ApiDescription apiDescription)
                => $"{apiDescription.ActionDescriptor.RouteValues["action"]}";
        }
    }
}
