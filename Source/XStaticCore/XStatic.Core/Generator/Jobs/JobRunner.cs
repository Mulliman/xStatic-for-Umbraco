using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Umbraco.Extensions;
using XStatic.Core.Generator.Headless;

namespace XStatic.Core.Generator.Jobs
{
    public class JobRunner
    {
        private readonly IGenerator _generator;
        private readonly HeadlessGenerator _headlessGenerator;

        public JobRunner(IGenerator generator, HeadlessGenerator headlessGenerator)
        {
            _generator = generator;
            _headlessGenerator = headlessGenerator;
        }

        public async Task<IEnumerable<GenerateItemResult>> RunJob(Job job)
        {
            var returnList = new List<GenerateItemResult>();

            if(_generator != null)
            {
                foreach (var id in job.PageIds)
                {
                    returnList.Add(await _generator.GeneratePage(id, job.StaticSiteId, job.NameGenerator, job.Transformers));
                }

                foreach (var id in job.MediaIds)
                {
                    returnList.Add(await _generator.GenerateMedia(id, job.StaticSiteId, job.MediaCropSizes));
                }

                foreach (var folder in job.Folders)
                {
                    returnList.AddRange(await _generator.GenerateFolder(folder, job.StaticSiteId));
                }

                foreach (var file in job.Files)
                {
                    returnList.Add(await _generator.GenerateFile(file, job.StaticSiteId));
                }
            }

            if(_headlessGenerator != null)
            {
                foreach (var task in job.ApiTasks)
                {
                    returnList.Add(await _headlessGenerator.GenerateApiResult(task.ApiPath, task.StoragePath, task.Headers, job.StaticSiteId));
                }
            }
            
            return returnList.Where(x => x != null);
        }
    }
}