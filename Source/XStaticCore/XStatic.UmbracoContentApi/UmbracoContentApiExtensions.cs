using Microsoft.Extensions.DependencyInjection;

namespace XStatic.UmbracoContentApi
{
    public static class UmbracoContentApiExtensions
    {
        public static IServiceCollection AddUmbracoContentApi(this IServiceCollection services)
        {
            services.AddSingleton<UmbracoContentApiGenerator>();

            return services;
        }
    }
}