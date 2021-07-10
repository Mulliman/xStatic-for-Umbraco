using System.Collections.Generic;

namespace XStatic.Generator.Transformers
{
    public interface ITransformerListFactory
    {
        IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig);
    }
}