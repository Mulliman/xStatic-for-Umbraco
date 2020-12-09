namespace XStatic.Generator.Storage
{
    public class JsonFileNameGenerator : IFileNameGenerator
    {
        public string GetFilePartialPath(string relativeUrl)
        {
            return relativeUrl.Trim('/') + ".json";
        }
    }
}