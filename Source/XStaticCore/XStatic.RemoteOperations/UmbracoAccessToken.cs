namespace XStatic.RemoteOperations
{
    public class UmbracoAccessToken(string value, DateTime expiry)
    {
        public string Value { get; } = value;

        public DateTime Expiry { get; } = expiry;
    }
}
