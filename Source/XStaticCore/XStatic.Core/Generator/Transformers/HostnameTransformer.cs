using System.Collections.Generic;
using System.Linq;
﻿using Umbraco.Cms.Core.Web;

namespace XStatic.Core.Generator.Transformers
{
    public class HostnameTransformer : ITransformer
    {
        private readonly string _targetHostname;
        private IEnumerable<string> _domains;

        public HostnameTransformer(string targetHostname)
        {
            _targetHostname = targetHostname;
        }

        public string Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return input;
            }

            if (_domains == null)
            {
                _domains = context.Domains.GetAll(false).Select(d => d.Name).ToList();
            }

            var output = input;

            foreach (var domainName in _domains)
            {
                output = output.Replace(domainName, _targetHostname);
            }

            return output;
        }
    }
}