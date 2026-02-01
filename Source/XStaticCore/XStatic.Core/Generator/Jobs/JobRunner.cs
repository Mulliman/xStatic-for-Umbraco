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

            foreach (var id in job.PageIds)
            {
                if (job.Cultures?.Any() == true)
                {
                    foreach (var culture in job.Cultures)
                    {
                        returnList.Add(await _generator.GeneratePage(id, job.StaticSiteId, job.NameGenerator, job.Transformers, culture));
                    }
                }
                else
                {
                    returnList.Add(await _generator.GeneratePage(id, job.StaticSiteId, job.NameGenerator, job.Transformers));
                }
            }

            foreach (var id in job.MediaIds)
            {
                returnList.Add(await _generator.GenerateMedia(id, job.StaticSiteId, job.MediaCropSizes));
            }

            foreach (var folder in job.Folders)
            {
                returnList.AddRange(await _generator.GenerateFolder(folder.Key, folder.Value, job.StaticSiteId));
            }

            foreach (var file in job.Files)
            {
                returnList.Add(await _generator.GenerateFile(file.Key, file.Value, job.StaticSiteId));
            }

            return returnList.Where(x => x != null);
        }
    }
}