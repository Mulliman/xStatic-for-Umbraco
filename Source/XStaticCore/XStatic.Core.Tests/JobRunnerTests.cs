using Moq;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using XStatic.Core.Generator;
using XStatic.Core.Generator.Jobs;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;
using Xunit;

namespace XStatic.Core.Tests
{
    public class JobRunnerTests
    {
        [Fact]
        public async Task RunJob_ShouldBeFasterThanSequential_WhenParallelized()
        {
            // Arrange
            var generatorMock = new Mock<IGenerator>();
            var delayMs = 50;
            var pageCount = 20;

            generatorMock.Setup(g => g.GeneratePage(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<IFileNameGenerator>(),
                It.IsAny<IEnumerable<ITransformer>>(),
                It.IsAny<string>()))
                .Returns(async () =>
                {
                    await Task.Delay(delayMs);
                    return new GenerateItemResult(true, "Page", "Test");
                });

            var job = new Job
            {
                PageIds = Enumerable.Range(1, pageCount).ToList(),
                StaticSiteId = 1
            };

            var runner = new JobRunner(generatorMock.Object);

            // Act
            var stopwatch = Stopwatch.StartNew();
            var results = await runner.RunJob(job);
            stopwatch.Stop();

            // Assert
            Assert.Equal(pageCount, results.Count());

            var sequentialTime = pageCount * delayMs;
            var threshold = sequentialTime * 0.7; // Expect at least 30% improvement

            Assert.True(stopwatch.ElapsedMilliseconds < threshold, $"Execution took {stopwatch.ElapsedMilliseconds}ms, which is slower than threshold {threshold}ms (Sequential est: {sequentialTime}ms)");
        }
    }
}
