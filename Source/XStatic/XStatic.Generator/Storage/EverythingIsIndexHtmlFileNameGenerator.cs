namespace XStatic.Generator.Storage
{
    public class EverythingIsIndexHtmlFileNameGenerator : IFileNameGenerator
    {
        public string GetFilePartialPath(string relativeUrl)
        {
            return relativeUrl.Trim('/') + "/index.html";
        }
    }
}