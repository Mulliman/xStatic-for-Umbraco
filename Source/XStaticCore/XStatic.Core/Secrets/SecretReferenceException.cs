namespace XStatic.Core.Secrets
{
    /// <summary>
    /// Thrown when a secret reference can't be resolved: the variable or key isn't allowed, or has no value.
    /// The message names the reference and the field, never a secret value, so it is safe to show and log.
    /// </summary>
    public class SecretReferenceException : XStaticException
    {
        public SecretReferenceException(string message) : base(message)
        {
        }
    }
}
