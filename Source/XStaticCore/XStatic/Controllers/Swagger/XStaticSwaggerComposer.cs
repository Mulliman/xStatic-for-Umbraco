using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;

namespace XStatic.Controllers.Swagger
{
    public class XStaticSwaggerComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
            => builder.Services.ConfigureOptions<XStaticConfigureSwaggerGenOptions>();
    }
}
