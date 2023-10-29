using System.Collections.Generic;
using XStatic.Core.Generator.Headless;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.Jobs
{
    public class Job
    {
        public int StaticSiteId { get; set; }

        public IFileNameGenerator NameGenerator { get; set; }

        public List<ITransformer> Transformers { get; set; } = new List<ITransformer>();

        public List<int> PageIds { get; set; } = new List<int>();

        public List<int> MediaIds { get; set; } = new List<int>();

        public List<Crop> MediaCropSizes { get; set; } = new List<Crop>();

        public List<string> Folders { get; set; } = new List<string>();

        public List<string> Files { get; set; } = new List<string>();

        public List<HeadlessApiTask> ApiTasks { get; set; }
    }
}