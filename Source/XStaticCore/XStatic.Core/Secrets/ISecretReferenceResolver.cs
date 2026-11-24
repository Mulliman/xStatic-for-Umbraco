using System.Collections.Generic;

namespace XStatic.Core.Secrets
{
    /// <summary>
    /// Turns <c>${env:NAME}</c> and <c>${config:Key}</c> references in deployment target and action settings into
    /// their values, just before a deployer, deployment target creator or post-generation action receives them.
    /// The stored settings keep the reference, so the secret itself never goes into the database or to the browser.
    /// </summary>
    public interface ISecretReferenceResolver
    {
        /// <summary>
        /// Resolves the references in one value. A <c>$${</c> escape becomes a literal <c>${</c>; a value with
        /// neither is returned unchanged.
        /// </summary>
        /// <param name="value">The stored value.</param>
        /// <param name="fieldAlias">The field the value belongs to, used in error messages. Optional.</param>
        /// <exception cref="SecretReferenceException">A reference isn't allowed or has no value.</exception>
        string Resolve(string value, string fieldAlias = null);

        /// <summary>
        /// Returns a new dictionary with every value resolved. The input isn't changed. Returns <c>null</c> for <c>null</c>.
        /// </summary>
        /// <exception cref="SecretReferenceException">A reference isn't allowed or has no value.</exception>
        Dictionary<string, string> Resolve(Dictionary<string, string> values);
    }
}
