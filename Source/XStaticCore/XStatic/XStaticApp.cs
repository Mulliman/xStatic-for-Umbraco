using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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