using System.Collections.Generic;

namespace XStatic.Core.Actions
{
    public class ConfiguredPostGenerationAction
    {
        public ConfiguredPostGenerationAction(IPostGenerationAction action, Dictionary<string, string> config)
        {
            Name = action.Name;
            Action = action;
            Config = config;
        }

        public string Name { get; set; }

        public IPostGenerationAction Action { get; }

        public Dictionary<string, string> Config { get; }
    }
}