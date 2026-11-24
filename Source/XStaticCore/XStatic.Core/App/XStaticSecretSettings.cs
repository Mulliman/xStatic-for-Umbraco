using System.Collections.Generic;

namespace XStatic.Core.App
{
    /// <summary>
    /// Controls which values deployment targets and post-generation actions can read through secret references
    /// such as <c>${env:XSTATIC_NETLIFY_TOKEN}</c> or <c>${config:XStatic:Secrets:NetlifyToken}</c>.
    /// Bound from <c>XStatic:Secrets</c> in appsettings.json.
    /// </summary>
    /// <remarks>
    /// Anyone who can edit a deployment target can send any value a reference is allowed to read to a server of
    /// their choosing (for example by pointing the FTP deployer at their own host). The defaults only allow names
    /// that are clearly meant for xStatic, so opening up other variables is a deliberate choice.
    /// </remarks>
    public class XStaticSecretSettings
    {
        /// <summary>The environment variable patterns used when <see cref="AllowedEnvironmentVariables"/> is empty.</summary>
        public static readonly IReadOnlyList<string> DefaultAllowedEnvironmentVariables = new[] { "XSTATIC_*" };

        /// <summary>The configuration key patterns used when <see cref="AllowedConfigurationKeys"/> is empty.</summary>
        public static readonly IReadOnlyList<string> DefaultAllowedConfigurationKeys = new[] { "XStatic:Secrets:*" };

        /// <summary>
        /// Environment variable names that <c>${env:NAME}</c> may read. Patterns can use <c>*</c> (any characters) and
        /// <c>?</c> (one character) and are matched without regard to case. Setting it replaces the defaults
        /// (<see cref="DefaultAllowedEnvironmentVariables"/>). Use <c>*</c> to allow every environment variable.
        /// </summary>
        public IList<string> AllowedEnvironmentVariables { get; set; } = new List<string>();

        /// <summary>
        /// Configuration keys that <c>${config:Key}</c> may read, in the same pattern format. Keys use <c>:</c> between
        /// sections. Setting it replaces the defaults (<see cref="DefaultAllowedConfigurationKeys"/>).
        /// </summary>
        public IList<string> AllowedConfigurationKeys { get; set; } = new List<string>();

        /// <summary>The environment variable patterns in force: the configured ones, or the defaults when none are set.</summary>
        public IReadOnlyList<string> GetEffectiveAllowedEnvironmentVariables()
            => Effective(AllowedEnvironmentVariables, DefaultAllowedEnvironmentVariables);

        /// <summary>The configuration key patterns in force: the configured ones, or the defaults when none are set.</summary>
        public IReadOnlyList<string> GetEffectiveAllowedConfigurationKeys()
            => Effective(AllowedConfigurationKeys, DefaultAllowedConfigurationKeys);

        private static IReadOnlyList<string> Effective(IList<string> configured, IReadOnlyList<string> defaults)
        {
            var patterns = new List<string>();

            if (configured != null)
            {
                foreach (var pattern in configured)
                {
                    if (!string.IsNullOrWhiteSpace(pattern))
                    {
                        patterns.Add(pattern.Trim());
                    }
                }
            }

            return patterns.Count > 0 ? patterns : defaults;
        }
    }
}
