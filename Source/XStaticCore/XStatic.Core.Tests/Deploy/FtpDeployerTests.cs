using System;
using System.Collections.Generic;
using System.Linq;
using FluentFTP;
using XStatic.Ftp;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class FtpDeployerTests
    {
        private static FtpResult Result(string path, bool success = false, bool failed = false, bool skipped = false, bool skippedByRule = false, Exception? ex = null)
            => new()
            {
                Type = FtpObjectType.File,
                RemotePath = path,
                IsSuccess = success,
                IsFailed = failed,
                IsSkipped = skipped,
                IsSkippedByRule = skippedByRule,
                Exception = ex,
            };

        [Fact]
        public void GetFailedItems_UploadedAndSkippedItemsAreNotFailures()
        {
            var results = new List<FtpResult>
            {
                Result("/index.html", success: true),
                Result("/same.css", skipped: true),
                Result("/ignored.tmp", skippedByRule: true),
            };

            Assert.Empty(FtpDeployer.GetFailedItems(results));
        }

        [Fact]
        public void GetFailedItems_IncludesItemsMarkedFailed()
        {
            var failed = Result("/a.html", failed: true, ex: new InvalidOperationException("denied"));

            Assert.Same(failed, Assert.Single(FtpDeployer.GetFailedItems(new[] { Result("/b.html", success: true), failed })));
        }

        [Fact]
        public void GetFailedItems_IncludesItemsNeitherUploadedNorFailed()
        {
            // What FluentFTP returns when the passive data connection is blocked: the folders are created, the files
            // come back with every flag false and no exception.
            var results = new List<FtpResult>
            {
                new() { Type = FtpObjectType.Directory, RemotePath = "/css/", IsSuccess = true },
                Result("/index.html"),
                Result("/css/site.css"),
            };

            var failed = FtpDeployer.GetFailedItems(results);

            Assert.Equal(new[] { "/index.html", "/css/site.css" }, failed.Select(f => f.RemotePath));
        }

        [Fact]
        public void GetFailedItems_NoResults_ReturnsEmpty()
        {
            Assert.Empty(FtpDeployer.GetFailedItems(null!));
            Assert.Empty(FtpDeployer.GetFailedItems(Array.Empty<FtpResult>()));
        }
    }
}
