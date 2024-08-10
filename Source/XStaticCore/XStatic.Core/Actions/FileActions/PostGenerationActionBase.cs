using System.Collections.Generic;
using System.Threading.Tasks;

namespace XStatic.Core.Actions.FileActions
{
    public abstract class PostGenerationActionBase : IPostGenerationAction
    {
        public abstract string Name { get; }

        public abstract Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters);

        protected string GetParameter(Dictionary<string, string> parameters, string key)
        {
            if (!parameters.TryGetValue(ResolveParamName(key), out string value))
            {
                return null;
            }

            return value;
        }

        protected string ResolveParamName(string param)
        {
            return $"{Name}.{param}";
        }

        public static string ResolveParamName(string actionName, string paramName)
        {
            return $"{actionName}.{paramName}";
        }
    }
}
