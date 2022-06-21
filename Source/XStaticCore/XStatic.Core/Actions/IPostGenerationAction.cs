using System.Collections.Generic;
using System.Threading.Tasks;

namespace XStatic.Core.Actions
{
    public interface IPostGenerationAction
    {
        Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters);
    }
}