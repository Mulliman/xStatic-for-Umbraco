using Microsoft.AspNetCore.Builder;
using System;

namespace XStatic.Generator.Startup
{
    public class GeneratorApp
    {
        private IServiceProvider _services;

        public GeneratorApp(IServiceProvider services)
        {
            _services = services;
        }
    }

    public static class GeneratorAppExtensions
    {
        public static GeneratorApp UseXStatic(this IApplicationBuilder app)
        {
            return new GeneratorApp(app.ApplicationServices);
        }
    }
}
