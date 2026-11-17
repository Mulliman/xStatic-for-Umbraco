using NUnit.Framework;
using Umbraco.Cms.Tests.Integration;

namespace XStatic.IntegrationTests
{
    // Required by Umbraco's integration test framework (creates/cleans up the test databases).
    [SetUpFixture]
    public class CustomGlobalSetupTeardown
    {
        private static GlobalSetupTeardown _setupTearDown;

        [OneTimeSetUp]
        public void SetUp()
        {
            _setupTearDown = new GlobalSetupTeardown();
            _setupTearDown.SetUp();
        }

        [OneTimeTearDown]
        public void TearDown() => _setupTearDown.TearDown();
    }
}
