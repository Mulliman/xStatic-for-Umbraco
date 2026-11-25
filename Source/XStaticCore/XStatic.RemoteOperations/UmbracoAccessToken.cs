namespace XStatic.RemoteOperations
{
    public class UmbracoAccessToken(string value, DateTime expiry)
    {
        public string Value { get; } = value;

        /// <summary>
        /// The UTC time at which this access token expires (with a small latency buffer applied).
        /// </summary>
        public DateTime Expiry { get; } = expiry;
    }
}
