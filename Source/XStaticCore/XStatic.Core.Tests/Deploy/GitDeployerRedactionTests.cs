using System;
using System.Collections.Generic;
using XStatic.Git;
using Xunit;

namespace XStatic.Core.Tests.Deploy
{
    public class GitDeployerRedactionTests
    {
        private sealed class ExposedGitDeployer(string remoteUrl, string password) : GitDeployer(new Dictionary<string, string>
        {
            [GitDeployerDefinition.FieldNames.RemoteUrl] = remoteUrl,
            [GitDeployerDefinition.FieldNames.Email] = "xstatic@example.com",
            [GitDeployerDefinition.FieldNames.Username] = "xstatic",
            [GitDeployerDefinition.FieldNames.Password] = password,
            [GitDeployerDefinition.FieldNames.Branch] = "main",
        })
        {
            public Exception Redact(Exception e) => RedactCredentials(e);
        }

        [Fact]
        public void RedactCredentials_HidesTokenInRemoteUrlAndPassword()
        {
            var deployer = new ExposedGitDeployer("https://sam:ghp_SECRET123@github.com/org/repo.git", "pa55word");
            var error = new InvalidOperationException(
                "failed to push to https://sam:ghp_SECRET123@github.com/org/repo.git",
                new Exception("auth pa55word rejected"));

            var redacted = deployer.Redact(error);

            Assert.NotSame(error, redacted);
            Assert.DoesNotContain("ghp_SECRET123", redacted.Message);
            Assert.DoesNotContain("pa55word", redacted.Message);
            Assert.Contains("***", redacted.Message);
            Assert.Contains("InvalidOperationException", redacted.Message);
            Assert.Null(redacted.InnerException);
        }

        [Fact]
        public void RedactCredentials_ReturnsTheOriginalWhenNothingLeaks()
        {
            var deployer = new ExposedGitDeployer("https://github.com/org/repo.git", "pa55word");
            var error = new InvalidOperationException("remote rejected the push");

            Assert.Same(error, deployer.Redact(error));
        }
    }
}
