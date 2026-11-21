using System.Linq;
using XStatic.Core.Generator;
using Xunit;

namespace XStatic.Core.Tests.Generator
{
    public class CropTests
    {
        [Fact]
        public void StringConstructor_ParsesNumbers()
        {
            var crop = new Crop("100", "50", "80");

            Assert.Equal(100, crop.Width);
            Assert.Equal(50, crop.Height);
            Assert.Equal(80, crop.QualityPercentage);
        }

        [Fact]
        public void StringConstructor_NullOrInvalidValuesBecomeNull()
        {
            var crop = new Crop(null!, "abc", "");

            Assert.Null(crop.Width);
            Assert.Null(crop.Height);
            Assert.Null(crop.QualityPercentage);
        }

        [Fact]
        public void GetCropsFromCommaDelimitedString_ParsesWidthAndHeight()
        {
            var crops = Crop.GetCropsFromCommaDelimitedString("100x50,800x600").ToList();

            Assert.Collection(crops,
                c => { Assert.Equal(100, c.Width); Assert.Equal(50, c.Height); Assert.Null(c.QualityPercentage); },
                c => { Assert.Equal(800, c.Width); Assert.Equal(600, c.Height); });
        }

        [Fact]
        public void GetCropsFromCommaDelimitedString_ParsesQuality()
        {
            var crop = Assert.Single(Crop.GetCropsFromCommaDelimitedString("100x50@75"));

            Assert.Equal(100, crop.Width);
            Assert.Equal(50, crop.Height);
            Assert.Equal(75, crop.QualityPercentage);
        }

        [Fact]
        public void GetCropsFromCommaDelimitedString_IgnoresWhitespace()
        {
            var crop = Assert.Single(Crop.GetCropsFromCommaDelimitedString(" 100 x 50 "));

            Assert.Equal(100, crop.Width);
            Assert.Equal(50, crop.Height);
        }

        [Fact]
        public void GetCropsFromCommaDelimitedString_AllowsMissingDimension()
        {
            var crop = Assert.Single(Crop.GetCropsFromCommaDelimitedString("100x"));

            Assert.Equal(100, crop.Width);
            Assert.Null(crop.Height);
        }

        [Theory]
        [InlineData("")]
        [InlineData(",,")]
        [InlineData("100")]
        [InlineData("100x50x25")]
        [InlineData("100x50@75@10")]
        public void GetCropsFromCommaDelimitedString_SkipsInvalidEntries(string input)
        {
            Assert.Empty(Crop.GetCropsFromCommaDelimitedString(input));
        }

        [Fact]
        public void GetCropsFromCommaDelimitedString_KeepsValidEntriesAroundInvalidOnes()
        {
            var crops = Crop.GetCropsFromCommaDelimitedString("100x50,nonsense,200x100").ToList();

            Assert.Equal(new int?[] { 100, 200 }, crops.Select(c => c.Width));
        }
    }
}
