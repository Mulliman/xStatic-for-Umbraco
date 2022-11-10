using System;
using System.Collections.Generic;
using System.Linq;

namespace XStatic.Core.Generator
{
    public class Crop
    {
        public Crop()
        {
        }

        public Crop(int? width, int? height, int? qualityPercentage = null)
        {
            Width = width;
            Height = height;
            QualityPercentage = qualityPercentage;
        }

        public Crop(string width, string height, string qualityPercentage = null)
        {
            Width = width != null && int.TryParse(width, out int parsedWidth) ? parsedWidth : null;
            Height = height != null && int.TryParse(height, out int parsedHeight) ? parsedHeight : null;
            QualityPercentage = qualityPercentage != null && int.TryParse(qualityPercentage, out int parsedQuality) ? parsedQuality : null; ;
        }

        public int? Height { get; set; }

        public int? Width { get; set; }

        public int? QualityPercentage { get; set; }

        public static IEnumerable<Crop> GetCropsFromCommaDelimitedString(string str)
        {
            var pairs = str.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

            foreach (var pair in pairs)
            {
                if (pair.Contains("x"))
                {
                    var values = pair.Split('x');

                    if (values.Length == 2)
                    {
                        var crop = AddQualityToCropIfRequired(values);

                        if(crop != null)
                        {
                            yield return crop;
                        }
                    }
                }
            }
        }

        private static Crop AddQualityToCropIfRequired(string[] dimensions)
        {
            var first = dimensions.First();
            var last = dimensions.Last();

            if (last.Contains("@"))
            {
                var subValues = last.Split('@');

                if (subValues.Length == 2)
                {
                    var height = StripNonNumericChars(subValues.First());
                    var percentage = StripNonNumericChars(subValues.Last());

                    return new Crop(StripNonNumericChars(first), height, percentage);
                }
            }
            else
            {
                return new Crop(StripNonNumericChars(first), StripNonNumericChars(last));
            }

            return null;
        }

        private static string StripNonNumericChars(string input)
        {
            if(string.IsNullOrWhiteSpace(input)) return input;

            return new string(input.Where(c => char.IsDigit(c)).ToArray());
        }
    }
}