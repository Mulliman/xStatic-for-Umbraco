using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Generator.Storage;

namespace XStatic.Core.Generator.Transformers
{
    public class CroppedImageUrlTransformer : ITransformer
    {
        private readonly IImageCropNameGenerator _imageCropNameGenerator;
        private readonly IEnumerable<Crop> _crops;

        public CroppedImageUrlTransformer(IImageCropNameGenerator imageCropNameGenerator, IEnumerable<Crop> crops)
        {
            _imageCropNameGenerator = imageCropNameGenerator;
            _crops = crops;
        }

        public string Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return input;
            }

            if (_crops?.Any() != true) return input;

            var updatedMarkup = input;

            foreach (var crop in _crops)
            {
                var imagesRegex = new Regex($"(?:['\"(])/media/((?=.*width={crop.Width})(?=.*height={crop.Height})).*(?:['\")])");
                updatedMarkup = imagesRegex.Replace(updatedMarkup, (match) =>
                {
                    var str = match.ToString();

                    var partialPath = str.Split('?').First().Trim('\'', '\"');

                    var fileName = Path.GetFileName(partialPath);
                    var fileExtension = Path.GetExtension(partialPath);
                    var pathSegment = partialPath.Replace(fileName, string.Empty);

                    var newName = _imageCropNameGenerator.GetCropFileName(Path.GetFileNameWithoutExtension(partialPath), crop);

                    return str.Replace(fileName, newName + fileExtension);
                });
            }

            return updatedMarkup;
        }
    }
}