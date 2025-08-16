using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Extensions;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.Jobs
{
    public class JobBuilder
    {
        private Job job;

        public JobBuilder(int staticSiteId, IFileNameGenerator nameGenerator)
        {
            job = new Job
            {
                StaticSiteId = staticSiteId,
                NameGenerator = nameGenerator
            };
        }

        public JobBuilder AddTransformer(ITransformer transformer)
        {
            job.Transformers.Add(transformer);

            return this;
        }

        public JobBuilder AddTransformers(IEnumerable<ITransformer> transformers)
        {
            job.Transformers.AddRange(transformers);

            return this;
        }

        public JobBuilder AddPage(IPublishedContent node)
        {
            if (node == null) return this;

            job.PageIds.Add(node.Id);

            return this;
        }

        public JobBuilder AddPageWithDescendants(IPublishedContent node)
        {
            if (node == null) return this;

            job.PageIds.Add(node.Id);

            var childIds = node.Descendants().Select(c => c.Id);

            job.PageIds.AddRange(childIds);

            return this;
        }

        public JobBuilder AddPageWithDescendantsWithoutTypes(IPublishedContent node, IEnumerable<string> excludedTypeAliases)
        {
	        if (node == null) return this;

	        job.PageIds.Add(node.Id);

            var childIds = node.Descendants().Where(c => !excludedTypeAliases.Contains(c.ContentType.Alias)).Select(c => c.Id);

	        job.PageIds.AddRange(childIds);

	        return this;
        }

        public JobBuilder AddMedia(IPublishedContent media)
        {
            if (media == null) return this;

            job.MediaIds.Add(media.Id);

            return this;
        }

        public JobBuilder AddMediaWithDescendants(IPublishedContent media)
        {
            if (media == null) return this;

            job.MediaIds.Add(media.Id);

            var childIds = media.Descendants().Select(c => c.Id);

            job.MediaIds.AddRange(childIds);

            return this;
        }

        public JobBuilder AddMediaCrops(IEnumerable<Crop> crops)
        {
            if (crops == null) return this;

            job.MediaCropSizes.AddRange(crops);

            return this;
        }

        public JobBuilder AddAssetFolder(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return this;

            job.Folders.Add(relativePath);

            return this;
        }

        public JobBuilder AddAssetFile(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return this;

            job.Files.Add(relativePath);

            return this;
        }

        public JobBuilder AddAssetFiles(IEnumerable<string> relativePaths)
        {
            if (relativePaths?.Any() != true) return this;

            foreach (var path in relativePaths)
            {
                job.Files.Add(path);
            }

            return this;
        }

        public Job Build()
        {
            return job;
        }
    }
}