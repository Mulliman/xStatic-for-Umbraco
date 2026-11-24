using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using XStatic.Core.App;

namespace XStatic.Core.Secrets
{
    /// <summary>
    /// The default <see cref="ISecretReferenceResolver"/>. <c>${env:NAME}</c> reads a process environment variable and
    /// <c>${config:Key}</c> reads <see cref="IConfiguration"/> (appsettings, user secrets, environment variables and any
    /// provider the site adds, such as Azure Key Vault). Only names allowed by <see cref="XStaticSecretSettings"/> can
    /// be read. Values are read every time, so a changed variable is picked up without saving the target again.
    /// </summary>
    public class SecretReferenceResolver : ISecretReferenceResolver
    {
        private const string EnvironmentSettingPath = "XStatic:Secrets:AllowedEnvironmentVariables";
        private const string ConfigurationSettingPath = "XStatic:Secrets:AllowedConfigurationKeys";

        private readonly IConfiguration _configuration;
        private readonly IOptions<XStaticGlobalSettings> _settings;
        private readonly ILogger<SecretReferenceResolver> _logger;

        public SecretReferenceResolver(IConfiguration configuration, IOptions<XStaticGlobalSettings> settings, ILogger<SecretReferenceResolver> logger = null)
        {
            _configuration = configuration;
            _settings = settings;
            _logger = logger;
        }

        public virtual string Resolve(string value, string fieldAlias = null)
        {
            var references = SecretReferenceParser.FindReferences(value);

            if (references.Count == 0)
            {
                // Still handle "$${" escapes so a literal "${env:...}" can be written.
                return SecretReferenceParser.Replace(value, r => r.DisplayName);
            }

            var secrets = _settings?.Value?.Secrets ?? new XStaticSecretSettings();
            var allowedEnv = secrets.GetEffectiveAllowedEnvironmentVariables();
            var allowedConfig = secrets.GetEffectiveAllowedConfigurationKeys();

            var resolved = SecretReferenceParser.Replace(value, reference => Lookup(reference, fieldAlias, allowedEnv, allowedConfig));

            _logger?.LogInformation("xStatic read {References} for field {Field}.",
                string.Join(", ", references.Select(r => r.DisplayName)), fieldAlias ?? "(unnamed)");

            return resolved;
        }

        public virtual Dictionary<string, string> Resolve(Dictionary<string, string> values)
        {
            if (values == null)
            {
                return null;
            }

            var result = new Dictionary<string, string>(values.Comparer);

            foreach (var entry in values)
            {
                result[entry.Key] = Resolve(entry.Value, entry.Key);
            }

            return result;
        }

        /// <summary>Reads an environment variable. Override in tests or to read from somewhere else.</summary>
        protected virtual string GetEnvironmentVariable(string name) => Environment.GetEnvironmentVariable(name);

        /// <summary>Reads a configuration key. Override in tests or to read from somewhere else.</summary>
        protected virtual string GetConfigurationValue(string key) => _configuration?[key];

        private string Lookup(SecretReference reference, string fieldAlias, IReadOnlyList<string> allowedEnv, IReadOnlyList<string> allowedConfig)
        {
            var field = string.IsNullOrEmpty(fieldAlias) ? "" : $" (used in '{fieldAlias}')";

            if (reference.Source == SecretReferenceSource.EnvironmentVariable)
            {
                if (!SecretNamePattern.IsAllowed(reference.Name, allowedEnv))
                {
                    throw new SecretReferenceException(
                        $"The environment variable '{reference.Name}'{field} isn't allowed. Rename it to match one of " +
                        $"{FormatPatterns(allowedEnv)}, or add it to {EnvironmentSettingPath} in appsettings.json.");
                }

                return GetEnvironmentVariable(reference.Name)
                    ?? throw new SecretReferenceException(
                        $"The environment variable '{reference.Name}'{field} isn't set on this server. Set it and restart the site if your host needs that.");
            }

            if (!SecretNamePattern.IsAllowed(reference.Name, allowedConfig))
            {
                throw new SecretReferenceException(
                    $"The configuration key '{reference.Name}'{field} isn't allowed. Move it to match one of " +
                    $"{FormatPatterns(allowedConfig)}, or add it to {ConfigurationSettingPath} in appsettings.json.");
            }

            return GetConfigurationValue(reference.Name)
                ?? throw new SecretReferenceException(
                    $"The configuration key '{reference.Name}'{field} has no value on this server.");
        }

        private static string FormatPatterns(IReadOnlyList<string> patterns)
            => string.Join(", ", patterns.Select(p => $"'{p}'"));
    }

    public static class SecretReferenceServiceCollectionExtensions
    {
        /// <summary>
        /// Registers the default <see cref="SecretReferenceResolver"/> unless an <see cref="ISecretReferenceResolver"/>
        /// is already registered. Its dependencies are optional, so this works in hosts that haven't registered
        /// <see cref="IConfiguration"/> or xStatic's options (it then only allows the default names).
        /// </summary>
        public static IServiceCollection TryAddXStaticSecretReferenceResolver(this IServiceCollection services)
        {
            services.TryAddSingleton<ISecretReferenceResolver>(sp => new SecretReferenceResolver(
                sp.GetService<IConfiguration>(),
                sp.GetService<IOptions<XStaticGlobalSettings>>(),
                sp.GetService<ILogger<SecretReferenceResolver>>()));

            return services;
        }
    }
}
