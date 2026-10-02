using Umbraco.Cms.Api.Common.OpenApi;
using Umbraco.Cms.Api.Management.OpenApi;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace XStatic.Controllers.OpenApi
{
    public class XStaticOpenApiComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.AddBackOfficeOpenApiDocument(
                "xstatic-v1",
                document => document
                    .WithTitle("xStatic v1")
                    .WithBackOfficeAuthentication()
                    .WithJsonOptions(Umbraco.Cms.Core.Constants.JsonOptionsNames.BackOffice));
    }
}
