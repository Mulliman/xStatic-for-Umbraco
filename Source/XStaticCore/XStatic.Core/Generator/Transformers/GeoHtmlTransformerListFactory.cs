using System.Collections.Generic;

namespace XStatic.Core.Generator.Transformers
{
    /// <summary>
    /// Extends <see cref="DefaultHtmlTransformerListFactory"/> with <see cref="MarkdownDiscoveryTransformer"/>
    /// so generated HTML pages advertise their companion Markdown endpoints for AI agents and GEO.
    /// </summary>
    public class GeoHtmlTransformerListFactory : DefaultHtmlTransformerListFactory
    {
        public override IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig)
        {
            foreach (var transformer in base.BuildTransformers(siteConfig))
            {
                yield return transformer;
            }

            yield return new MarkdownDiscoveryTransformer(siteConfig?.TargetHostname);
        }
    }
}
