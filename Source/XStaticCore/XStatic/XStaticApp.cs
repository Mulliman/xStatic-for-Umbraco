using Microsoft.AspNetCore.Builder;
using System;
using XStatic.Generator.Startup;

namespace XStatic
{
    public class XStaticApp
    {
        private IServiceProvider _services;

        public XStaticApp(IServiceProvider services)
        {
            _services = services;
        }

        public GeneratorApp Generate { get; set; }
    }

    public static class XStaticAppExtensions
    {
        public static GeneratorApp UseXStatic(this IApplicationBuilder app)
        {
            return new GeneratorApp(app.ApplicationServices);
        }
    }
}