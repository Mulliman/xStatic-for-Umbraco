namespace XStatic.Core.Generator.Storage
{
    public interface IFileNameGenerator
    {
        string GetFilePartialPath(string relativeUrl);
    }
}