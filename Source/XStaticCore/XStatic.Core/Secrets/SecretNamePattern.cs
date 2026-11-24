using System;
using System.Collections.Generic;

namespace XStatic.Core.Secrets
{
    /// <summary>
    /// Matches environment variable names and configuration keys against allow-list patterns. <c>*</c> matches any
    /// run of characters (including none) and <c>?</c> matches exactly one. Matching ignores case.
    /// </summary>
    public static class SecretNamePattern
    {
        public static bool IsAllowed(string name, IEnumerable<string> patterns)
        {
            if (string.IsNullOrEmpty(name) || patterns == null)
            {
                return false;
            }

            foreach (var pattern in patterns)
            {
                if (!string.IsNullOrWhiteSpace(pattern) && IsMatch(name, pattern.Trim()))
                {
                    return true;
                }
            }

            return false;
        }

        public static bool IsMatch(string name, string pattern)
        {
            if (name == null || pattern == null)
            {
                return false;
            }

            // Iterative wildcard match with backtracking to the last '*'. Linear in practice, no regex needed.
            int n = 0, p = 0, star = -1, starMatch = 0;

            while (n < name.Length)
            {
                if (p < pattern.Length && (pattern[p] == '?' || CharEquals(pattern[p], name[n])))
                {
                    n++;
                    p++;
                }
                else if (p < pattern.Length && pattern[p] == '*')
                {
                    star = p++;
                    starMatch = n;
                }
                else if (star >= 0)
                {
                    p = star + 1;
                    n = ++starMatch;
                }
                else
                {
                    return false;
                }
            }

            while (p < pattern.Length && pattern[p] == '*')
            {
                p++;
            }

            return p == pattern.Length;
        }

        private static bool CharEquals(char a, char b)
            => char.ToUpperInvariant(a) == char.ToUpperInvariant(b);
    }
}
