using Umbraco.Cms.Api.Management.OpenApi;

namespace XStatic.Controllers.Swagger
{
    public class XStaticBackOfficeSecurityRequirementsOperationFilter : BackOfficeSecurityRequirementsOperationFilterBase
    {
        protected override string ApiName => "xstatic-v1";
    }
}
