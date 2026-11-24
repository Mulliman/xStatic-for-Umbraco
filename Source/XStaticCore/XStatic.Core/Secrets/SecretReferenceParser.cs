using System;
using System.Collections.Generic;
using System.Text;

namespace XStatic.Core.Secrets
{
    /// <summary>Where a secret reference reads its value from.</summary>
    public enum SecretReferenceSource
    {
        /// <summary><c>${env:NAME}</c>: a process environment variable.</summary>
        EnvironmentVariable,

        /// <summary><c>${config:Section:Key}</c>: a key from the site's <c>IConfiguration</c>.</summary>
        Configuration,
    }

    /// <summary>One <c>${env:NAME}</c> or <c>${config:Key}</c> reference found in a value.</summary>
    public sealed class SecretReference
    {
        public SecretReference(SecretReferenceSource source, string name, int index, int length)
        {
            Source = source;
            Name = name;
            Index = index;
            Length = length;
        }

        public SecretReferenceSource Source { get; }

        /// <summary>The environment variable name or configuration key.</summary>
        public string Name { get; }

        /// <summary>Where the reference starts in the original value.</summary>
        public int Index { get; }

        /// <summary>The length of the reference text, including <c>${</c> and <c>}</c>.</summary>
        public int Length { get; }

        /// <summary>The reference written the short way, for messages and logs, e.g. <c>env:XSTATIC_TOKEN</c>.</summary>
        public string DisplayName => (Source == SecretReferenceSource.EnvironmentVariable ? "env:" : "config:") + Name;
    }

    /// <summary>
    /// Finds and replaces secret references in deployment target and action values.
    /// </summary>
    /// <remarks>
    /// The syntax is <c>${env:NAME}</c> or <c>${config:Section:Key}</c>. A reference can make up the whole value or
    /// sit inside it, e.g. <c>https://${env:XSTATIC_GIT_USER}:${env:XSTATIC_GIT_TOKEN}@github.com/org/repo.git</c>.
    /// <c>$${</c> is written out as a literal <c>${</c>. Anything else that looks like <c>${...}</c> but doesn't start
    /// with <c>env:</c> or <c>config:</c> is left exactly as it is, so existing values keep working.
    /// </remarks>
    public static class SecretReferenceParser
    {
        private const string EnvPrefix = "env:";
        private const string ConfigPrefix = "config:";

        /// <summary>True when the value contains at least one <c>${env:...}</c> or <c>${config:...}</c> reference.</summary>
        public static bool ContainsReference(string value) => FindReferences(value).Count > 0;

        /// <summary>Lists the references in a value, in order. Escaped references (<c>$${...}</c>) aren't included.</summary>
        public static IReadOnlyList<SecretReference> FindReferences(string value)
        {
            var references = new List<SecretReference>();

            if (string.IsNullOrEmpty(value) || value.IndexOf("${", StringComparison.Ordinal) < 0)
            {
                return references;
            }

            var i = 0;
            while (i < value.Length)
            {
                if (IsEscape(value, i))
                {
                    i += 3;
                    continue;
                }

                if (TryReadReference(value, i, out var reference))
                {
                    references.Add(reference);
                    i += reference.Length;
                    continue;
                }

                i++;
            }

            return references;
        }

        /// <summary>
        /// Replaces every reference in <paramref name="value"/> with the result of <paramref name="lookup"/> and turns
        /// <c>$${</c> into <c>${</c>. A value with no <c>${</c> in it is returned unchanged.
        /// </summary>
        public static string Replace(string value, Func<SecretReference, string> lookup)
        {
            if (lookup == null) throw new ArgumentNullException(nameof(lookup));

            if (string.IsNullOrEmpty(value) || value.IndexOf("${", StringComparison.Ordinal) < 0)
            {
                return value;
            }

            var result = new StringBuilder(value.Length);
            var i = 0;

            while (i < value.Length)
            {
                if (IsEscape(value, i))
                {
                    result.Append("${");
                    i += 3;
                    continue;
                }

                if (TryReadReference(value, i, out var reference))
                {
                    result.Append(lookup(reference));
                    i += reference.Length;
                    continue;
                }

                result.Append(value[i]);
                i++;
            }

            return result.ToString();
        }

        /// <summary>
        /// Puts references back into a dictionary that was built from resolved values. A deployment target creator
        /// receives resolved values and copies some of them (such as a token) into the target it creates; this swaps
        /// each copied secret back to the value the user typed, so the secret itself is never saved. Values written
        /// with a <c>$${</c> escape are put back too, so the escape survives.
        /// </summary>
        /// <remarks>
        /// A field with the same key as an input field is matched first. Other fields are matched by value, also
        /// ignoring surrounding whitespace, because creators often trim what they copy. When two inputs resolve to
        /// the same value, the first one wins.
        /// </remarks>
        /// <param name="original">The values as the user typed them, references included.</param>
        /// <param name="resolved">The same values after resolving.</param>
        /// <param name="output">The dictionary to fix up, changed in place.</param>
        public static void RestoreReferences(IDictionary<string, string> original, IDictionary<string, string> resolved, IDictionary<string, string> output)
        {
            if (original == null || resolved == null || output == null)
            {
                return;
            }

            var changed = new Dictionary<string, string>();
            var resolvedToOriginal = new Dictionary<string, string>(StringComparer.Ordinal);

            foreach (var entry in original)
            {
                // Anything with "${" in it may have changed: a reference was replaced or a "$${" escape was undone.
                if (string.IsNullOrEmpty(entry.Value)
                    || entry.Value.IndexOf("${", StringComparison.Ordinal) < 0
                    || !resolved.TryGetValue(entry.Key, out var resolvedValue)
                    || string.IsNullOrEmpty(resolvedValue)
                    || resolvedValue == entry.Value)
                {
                    continue;
                }

                changed[entry.Key] = resolvedValue;
                resolvedToOriginal.TryAdd(resolvedValue, entry.Value);

                var trimmed = resolvedValue.Trim();
                if (trimmed.Length > 0)
                {
                    resolvedToOriginal.TryAdd(trimmed, entry.Value);
                }
            }

            if (resolvedToOriginal.Count == 0)
            {
                return;
            }

            foreach (var key in new List<string>(output.Keys))
            {
                var value = output[key];

                if (value == null)
                {
                    continue;
                }

                if (changed.TryGetValue(key, out var sameKeyResolved)
                    && (value == sameKeyResolved || value == sameKeyResolved.Trim()))
                {
                    output[key] = original[key];
                }
                else if (resolvedToOriginal.TryGetValue(value, out var typed)
                    || resolvedToOriginal.TryGetValue(value.Trim(), out typed))
                {
                    output[key] = typed;
                }
            }
        }

        private static bool IsEscape(string value, int i)
            => value[i] == '$' && i + 2 < value.Length && value[i + 1] == '$' && value[i + 2] == '{';

        private static bool TryReadReference(string value, int i, out SecretReference reference)
        {
            reference = null;

            if (value[i] != '$' || i + 1 >= value.Length || value[i + 1] != '{')
            {
                return false;
            }

            var end = value.IndexOf('}', i + 2);
            if (end < 0)
            {
                return false;
            }

            var body = value.Substring(i + 2, end - i - 2);
            SecretReferenceSource source;
            string name;

            if (body.StartsWith(EnvPrefix, StringComparison.OrdinalIgnoreCase))
            {
                source = SecretReferenceSource.EnvironmentVariable;
                name = body.Substring(EnvPrefix.Length).Trim();
            }
            else if (body.StartsWith(ConfigPrefix, StringComparison.OrdinalIgnoreCase))
            {
                source = SecretReferenceSource.Configuration;
                name = body.Substring(ConfigPrefix.Length).Trim();
            }
            else
            {
                return false;
            }

            if (name.Length == 0 || name.IndexOf('{') >= 0)
            {
                return false;
            }

            reference = new SecretReference(source, name, i, end - i + 1);
            return true;
        }
    }
}
