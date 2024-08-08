using System.Collections.Generic;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.Jobs
{
    public class Job
    {
        public int StaticSiteId { get; set; }

        public IFileNameGenerator NameGenerator { get; set; }

        public List<ITransformer> Transformers { get; set; } = [];

        public List<int> PageIds { get; set; } = [];

        public List<string> Cultures { get; set; } = [];

        public List<int> MediaIds { get; set; } = [];

        public List<Crop> MediaCropSizes { get; set; } = [];

        public List<string> Folders { get; set; } = [];

        public List<string> Files { get; set; } = [];
    }
}