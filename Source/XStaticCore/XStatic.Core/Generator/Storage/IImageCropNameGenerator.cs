namespace XStatic.Core.Generator.Storage
{
    public interface IImageCropNameGenerator
    {
        string GetCropFileName(string fileNameWithoutExtension, Crop crop);
    }
}