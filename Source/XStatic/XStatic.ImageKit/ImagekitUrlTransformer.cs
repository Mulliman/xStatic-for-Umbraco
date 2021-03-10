using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Umbraco.Web;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.ImageKit
{
    public class ImagekitUrlTransformer : ITransformer
    {
        private readonly IEnumerable<Crop> _crops;

        public ImagekitUrlTransformer(IEnumerable<Crop> crops)
        {
            _crops = crops;
        }

        public string Transform(string input, UmbracoContext context)
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
                    var preAndPostQueryParts = str.Split('?');
                    var partialPath = preAndPostQueryParts.First().Trim('\'', '\"');
                    var fileName = Path.GetFileName(partialPath);
                    string newMediaPath = GetResizedUrl(crop, partialPath);

                    return str.Replace("?", "&").Replace(partialPath, newMediaPath);
                });
            }

            return updatedMarkup;
        }

        private static string GetResizedUrl(Crop crop, string partialPath)
        {
            var query = "?";
            var hasWidth = crop.Width.HasValue && crop.Width > 0;
            var hasHeight = crop.Height.HasValue && crop.Height > 0;

            if (hasHeight && hasWidth)
            {
                query += $"tr=w-{crop.Width},h-{crop.Height},ot-Imagekit,ots-16,otc-FFFFFF";
            }
            else if (hasHeight)
            {
                query += $"tr=h-{crop.Height},ot-Imagekit,ots-16,otc-FFFFFF";
            }
            else if (hasWidth)
            {
                query += $"tr=w-{crop.Width},ot-Imagekit,ots-16,otc-FFFFFF";
            }

            return "https://ik.imagekit.io/xstatic" + partialPath.Replace("/media", string.Empty) + query;
        }
    }
}