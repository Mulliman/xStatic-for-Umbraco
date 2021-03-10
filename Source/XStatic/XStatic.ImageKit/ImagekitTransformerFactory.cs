using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.ImageKit
{
    public class ImagekitTransformerFactory : ITransformerListFactory
    {
        public virtual IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig)
        {
            yield return new CachedByTransformer();

            if (!string.IsNullOrEmpty(siteConfig.ImageCrops))
            {
                var crops = Crop.GetCropsFromCommaDelimitedString(siteConfig.ImageCrops);
                yield return new ImagekitUrlTransformer(crops);
            }

            if (!string.IsNullOrEmpty(siteConfig.TargetHostname))
            {
                yield return new HostnameTransformer(siteConfig.TargetHostname);
            }
        }
    }
}