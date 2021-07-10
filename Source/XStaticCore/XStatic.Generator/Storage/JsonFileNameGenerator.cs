namespace XStatic.Generator.Storage
{
    public class JsonFileNameGenerator : IFileNameGenerator
    {
        public string GetFilePartialPath(string relativeUrl)
        {
            var trimmedPath = relativeUrl?.Trim('/');

            return string.IsNullOrEmpty(trimmedPath) ? "index.json" : trimmedPath + ".json";
        }
    }
}