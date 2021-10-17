namespace XStatic.Core.Generator.Storage
{
    public class ImageCropNameGenerator : IImageCropNameGenerator
    {
        public string GetCropFileName(string fileNameWithoutExtension, Crop crop)
        {
            return $"{fileNameWithoutExtension}--{crop.Width ?? 0}x{crop.Height ?? 0}";
        }
    }
}