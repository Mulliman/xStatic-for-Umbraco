using Moq;
using Umbraco.Cms.Core.Models.PublishedContent;
using XStatic.Core.Generator.Jobs;
using XStatic.Core.Generator.Storage;
using Xunit;

namespace XStatic.Core.Tests.Generator
{
    public class JobBuilderTests
    {
        [Fact]
        public void NullAndEmptyInputs_AreIgnored()
        {
            var job = new JobBuilder(1, Mock.Of<IFileNameGenerator>())
                .AddPage(null!)
                .AddPageWithDescendants(null!)
                .AddPageWithDescendantsWithoutTypes(null!, new[] { "x" })
                .AddMedia(null!)
                .AddMediaWithDescendants(null!)
                .AddMediaCrops(null!)
                .AddCulture(null!)
                .AddCulture("")
                .AddAssetFolder(" ", "rel")
                .AddAssetFile("", "rel")
                .AddAssetFiles(null!)
                .AddAssetFiles(new System.Collections.Generic.Dictionary<string, string>())
                .Build();

            Assert.Empty(job.PageIds);
            Assert.Empty(job.MediaIds);
            Assert.Empty(job.MediaCropSizes);
            Assert.Empty(job.Cultures);
            Assert.Empty(job.Folders);
            Assert.Empty(job.Files);
        }

        [Fact]
        public void AddPageAndMedia_RecordIds()
        {
            var page = Mock.Of<IPublishedContent>(p => p.Id == 10);
            var media = Mock.Of<IPublishedContent>(m => m.Id == 20);

            var job = new JobBuilder(1, Mock.Of<IFileNameGenerator>()).AddPage(page).AddMedia(media).Build();

            Assert.Equal(new[] { 10 }, job.PageIds);
            Assert.Equal(new[] { 20 }, job.MediaIds);
        }
    }
}
