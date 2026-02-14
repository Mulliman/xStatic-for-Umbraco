using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Jobs;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using Xunit;
using Xunit.Abstractions;

namespace XStatic.Core.Tests
{
    public class JobRunnerBenchmarks
    {
        private readonly ITestOutputHelper _output;

        public JobRunnerBenchmarks(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task Benchmark_RunJob_Performance()
        {
            // Arrange
            var mockGenerator = new Mock<IGenerator>();
            mockGenerator.Setup(g => g.GeneratePage(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<IFileNameGenerator>(), It.IsAny<IEnumerable<ITransformer>>(), It.IsAny<string>()))
                .Returns(async () =>
                {
                    await Task.Delay(10); // Simulate 10ms work per page
                    return GenerateItemResult.Success("Page", "item");
                });

            var job = new Job
            {
                PageIds = Enumerable.Range(1, 100).ToList(),
                StaticSiteId = 1,
                NameGenerator = Mock.Of<IFileNameGenerator>()
            };

            var runner = new JobRunner(mockGenerator.Object);

            // Act
            var stopwatch = Stopwatch.StartNew();
            var results = await runner.RunJob(job);
            stopwatch.Stop();

            // Assert
            Assert.Equal(100, results.Count());
            _output.WriteLine($"Execution Time: {stopwatch.ElapsedMilliseconds} ms");
        }
    }
}
