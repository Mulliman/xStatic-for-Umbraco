using Microsoft.AspNetCore.OpenApi;
using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace XStatic.Controllers.OpenApi
{
    public class XStaticOpenApiComposer : IComposer
    {
        public const string ApiDescription =
            "Management API for xStatic static site generation and deployment in Umbraco 18+. "
            + "Supports Umbraco BackOffice and OAuth2 client-credentials API User bearer tokens. "
            + "When xStatic user roles are enabled, assign API users to the xStaticNormalUser group "
            + "(sites, generate, deploy, config, download) and xStaticAdmin group (actions, deployment targets).";

        public void Compose(IUmbracoBuilder builder)
            => builder.AddBackOfficeOpenApiDocument(
                XStaticOpenApiOperationTransformer.ApiName,
                document => document
                    .WithTitle("xStatic Management API")
                    .WithBackOfficeAuthentication()
                    .WithJsonOptions(Umbraco.Cms.Core.Constants.JsonOptionsNames.BackOffice)
                    .ConfigureOpenApiOptions(options =>
                    {
                        options.AddOperationTransformer<XStaticOpenApiOperationTransformer>();
                        options.AddDocumentTransformer((doc, _, _) =>
                        {
                            doc.Info ??= new Microsoft.OpenApi.OpenApiInfo();
                            doc.Info.Description = ApiDescription;
                            return System.Threading.Tasks.Task.CompletedTask;
                        });
                    }));
    }
}
