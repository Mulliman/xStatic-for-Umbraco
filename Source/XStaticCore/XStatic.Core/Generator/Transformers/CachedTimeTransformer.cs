﻿using Umbraco.Cms.Core.Web;

namespace XStatic.Core.Generator.Transformers
{
    public class CachedTimeTransformer : ITransformer
    {
        public string Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return input;
            }

            return input.Replace("</body>", string.Format("<!-- Cached by xStatic at {0} --></body>", System.DateTime.Now));
        }
    }
}
