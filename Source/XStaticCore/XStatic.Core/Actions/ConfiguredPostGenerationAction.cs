using System;
using System.Collections.Generic;
using XStatic.Core.Secrets;

namespace XStatic.Core.Actions
{
    public class ConfiguredPostGenerationAction
    {
        private readonly Lazy<Dictionary<string, string>> _config;

        public ConfiguredPostGenerationAction(IPostGenerationAction action, Dictionary<string, string> config)
            : this(action, config, null)
        {
        }

        /// <param name="secretResolver">
        /// Resolves <c>${env:...}</c> and <c>${config:...}</c> references in <paramref name="config"/> the first time
        /// <see cref="Config"/> is read. When <c>null</c>, the config is used exactly as stored.
        /// </param>
        public ConfiguredPostGenerationAction(IPostGenerationAction action, Dictionary<string, string> config, ISecretReferenceResolver secretResolver)
        {
            Name = action.Name;
            Action = action;
            RawConfig = config;
            _config = new Lazy<Dictionary<string, string>>(() => secretResolver != null ? secretResolver.Resolve(config) : config);
        }

        public string Name { get; set; }

        public IPostGenerationAction Action { get; }

        /// <summary>
        /// The action's settings with secret references resolved. They are resolved when this is first read, so a
        /// reference that can't be resolved throws <see cref="SecretReferenceException"/> here, where the caller
        /// running the action can report it against this action.
        /// </summary>
        public Dictionary<string, string> Config => _config.Value;

        /// <summary>The action's settings as stored, with any secret references left in place.</summary>
        public Dictionary<string, string> RawConfig { get; }
    }
}