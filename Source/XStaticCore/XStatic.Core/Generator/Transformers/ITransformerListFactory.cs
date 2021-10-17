using System.Collections.Generic;

namespace XStatic.Core.Generator.Transformers
{
    public interface ITransformerListFactory
    {
        IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig);
    }
}