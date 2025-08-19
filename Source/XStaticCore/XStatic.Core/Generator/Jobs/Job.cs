using System.Collections.Generic;
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

        public Dictionary<string,string> Folders { get; set; } = new Dictionary<string,string>();

        public Dictionary<string,string> Files { get; set; } = new Dictionary<string,string>();
    }
}