using System.Collections.Generic;
using System.Threading.Tasks;

namespace XStatic.Core.Actions.FileActions
{
    public class EmptyTestAction : PostGenerationActionBase
    {
        public override string Name => nameof(EmptyTestAction);

        public override Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            return Task.FromResult(XStaticResult.Success());
        }
    }
}
