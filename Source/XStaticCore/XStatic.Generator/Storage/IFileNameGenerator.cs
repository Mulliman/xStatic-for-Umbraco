namespace XStatic.Generator.Storage
{
    public interface IFileNameGenerator
    {
        string GetFilePartialPath(string relativeUrl);
    }
}