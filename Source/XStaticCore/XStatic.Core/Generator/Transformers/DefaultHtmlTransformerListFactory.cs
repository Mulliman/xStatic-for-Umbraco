using System.Collections.Generic;
using Microsoft.Extensions.Options;
using XStatic.Core.App;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Services;

namespace XStatic.Core.Generator.Transformers
{
    public class DefaultHtmlTransformerListFactory : ITransformerListFactory
    {
        private readonly XStaticGlobalSettings _settings;
        private readonly IAiService _aiService;

        public DefaultHtmlTransformerListFactory(IOptions<XStaticGlobalSettings> settings, IAiService aiService)
        {
            _settings = settings.Value;
            _aiService = aiService;
        }

        // Keep a parameterless constructor for backward compatibility if instantiated manually,
        // though DatabaseExportTypeService should be updated to use DI.
        // However, if we add this constructor, we must ensure existing code calling new() still works or is updated.
        // Based on the plan, we are updating the caller, but to be safe and avoid compilation errors if I missed one:
        public DefaultHtmlTransformerListFactory()
        {
        }

        public virtual IEnumerable<ITransformer> BuildTransformers(ISiteConfig siteConfig)
        {
            if (_settings?.Ai?.Enabled == true && _settings.Ai.AutoGenerateMetaDescriptions)
            {
                // Add AI transformer first or last?
                // Probably better to add it before caching but after any content generation.
                // Transformers run in order.
                if (_aiService != null)
                {
                    yield return new AiMetaTransformer(_aiService);
                }
            }

            yield return new CachedByTransformer();

            if (!string.IsNullOrEmpty(siteConfig.ImageCrops))
            {
                var crops = Crop.GetCropsFromCommaDelimitedString(siteConfig.ImageCrops);
                yield return new CroppedImageUrlTransformer(new ImageCropNameGenerator(), crops);
            }

            if (!string.IsNullOrEmpty(siteConfig.TargetHostname))
            {
                yield return new HostnameTransformer(siteConfig.TargetHostname);
            }
        }
    }
}
