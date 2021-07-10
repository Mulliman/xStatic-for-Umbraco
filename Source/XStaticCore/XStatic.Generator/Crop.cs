using Superpower;
using System;
using System.Collections.Generic;
using System.Linq;

namespace XStatic.Generator
{
    public class Crop
    {
        public Crop()
        {
        }

        public Crop(int? width, int? height)
        {
            Width = width;
            Height = height;
        }

        public Crop(string width, string height)
        {
            Width = width != null && int.TryParse(width, out int parsedWidth) ? (int?)parsedWidth : null;
            Height = height != null && int.TryParse(height, out int parsedHeight) ? (int?)parsedHeight : null;
        }

        public int? Height { get; set; }

        public int? Width { get; set; }

        public static IEnumerable<Crop> GetCropsFromCommaDelimitedString(string str)
        {
            var pairs = str.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);

            foreach(var pair in pairs)
            {
                if (pair.Contains("x"))
                {
                    var values = pair.Split('x');

                    if(values.Length == 2)
                    {
                        yield return new Crop(values.First(), values.Last());
                    }
                }
            }
        }
    }
}