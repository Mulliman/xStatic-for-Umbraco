using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Umbraco.Extensions;

namespace XStatic.Core.Generator.Jobs
{
    public class JobRunner
    {
        private readonly IGenerator _generator;

        public JobRunner(IGenerator generator)
        {
            _generator = generator;
        }

        public async Task<IEnumerable<GenerateItemResult>> RunJob(Job job)
        {
            var returnList = new List<GenerateItemResult>();

            // Prepare indexed source for parallelism to preserve order
            var indexedPages = job.PageIds.Select((id, index) => (Id: id, Index: index)).ToList();
            var pageResults = new ConcurrentDictionary<int, List<GenerateItemResult>>();

            await Parallel.ForEachAsync(indexedPages, new ParallelOptions { MaxDegreeOfParallelism = System.Environment.ProcessorCount * 2 }, async (item, token) =>
            {
                var localResults = new List<GenerateItemResult>();
                if (job.Cultures?.Any() == true)
                {
                    foreach (var culture in job.Cultures)
                    {
                        localResults.Add(await _generator.GeneratePage(item.Id, job.StaticSiteId, job.NameGenerator, job.Transformers, culture));
                    }
                }
                else
                {
                    localResults.Add(await _generator.GeneratePage(item.Id, job.StaticSiteId, job.NameGenerator, job.Transformers));
                }
                pageResults[item.Index] = localResults;
            });

            // Add results in original order
            for (int i = 0; i < indexedPages.Count; i++)
            {
                if (pageResults.TryGetValue(i, out var results))
                {
                    returnList.AddRange(results);
                }
            }

            foreach (var id in job.MediaIds)
            {
                returnList.Add(await _generator.GenerateMedia(id, job.StaticSiteId, job.MediaCropSizes));
            }

            foreach (var folder in job.Folders)
            {
                var folderItems = await _generator.GenerateFolder(folder.Key, folder.Value, job.StaticSiteId);
                foreach (var item in folderItems)
                {
                    returnList.Add(item);
                }
            }

            foreach (var file in job.Files)
            {
                returnList.Add(await _generator.GenerateFile(file.Key, file.Value, job.StaticSiteId));
            }

            return returnList.Where(x => x != null);
        }
    }
}
