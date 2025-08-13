using System.Collections.Generic;
using System.Linq;

namespace XStatic.Core.Generator.Processes
{
    public class RebuildProcessResult
    {
        public bool WasSuccessful { get; set; }

        public List<GenerateItemResult> Results { get; set; } = new List<GenerateItemResult>();

        public List<GenerateItemResult> Warnings => Results.Where(r => !r.WasSuccessful).ToList();

        public int SiteId { get; set; }

        public long BuildTime { get; set; }

        public string Exception { get; set; }

        public string ExceptionTrace { get; set; }
    }
}