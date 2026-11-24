using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Secrets;
using Xunit;

namespace XStatic.Core.Tests.Secrets
{
    public class SecretReferenceParserTests
    {
        [Fact]
        public void FindReferences_FindsEnvAndConfigReferencesInsideAValue()
        {
            var references = SecretReferenceParser.FindReferences("https://${env:XSTATIC_USER}:${config:XStatic:Secrets:Token}@github.com/org/repo.git");

            Assert.Collection(references,
                r => { Assert.Equal(SecretReferenceSource.EnvironmentVariable, r.Source); Assert.Equal("XSTATIC_USER", r.Name); },
                r => { Assert.Equal(SecretReferenceSource.Configuration, r.Source); Assert.Equal("XStatic:Secrets:Token", r.Name); });
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("hunter2")]
        [InlineData("${vault:thing}")]
        [InlineData("${env:}")]
        [InlineData("${env:NO_END")]
        [InlineData("$${env:XSTATIC_ESCAPED}")]
        public void FindReferences_IgnoresValuesWithoutReferences(string? value)
        {
            Assert.Empty(SecretReferenceParser.FindReferences(value));
            Assert.False(SecretReferenceParser.ContainsReference(value));
        }

        [Fact]
        public void FindReferences_IgnoresCaseOfSourceAndTrimsName()
        {
            var reference = Assert.Single(SecretReferenceParser.FindReferences("${ENV: XSTATIC_TOKEN }"));

            Assert.Equal(SecretReferenceSource.EnvironmentVariable, reference.Source);
            Assert.Equal("XSTATIC_TOKEN", reference.Name);
        }

        [Fact]
        public void Replace_SubstitutesEachReferenceAndUnescapesDoubleDollar()
        {
            var result = SecretReferenceParser.Replace(
                "${env:A}-${config:B:C}-$${env:LITERAL}-${other:kept}",
                r => r.Name.ToLowerInvariant());

            Assert.Equal("a-b:c-${env:LITERAL}-${other:kept}", result);
        }

        [Fact]
        public void Replace_ReturnsValueWithoutReferencesUnchanged()
        {
            const string value = "plain-value";

            Assert.Same(value, SecretReferenceParser.Replace(value, _ => "x"));
        }

        [Fact]
        public void RestoreReferences_PutsCopiedSecretsBackAsReferences()
        {
            var original = new Dictionary<string, string> { ["Creator.PAT"] = "${env:XSTATIC_NETLIFY}", ["Creator.Name"] = "my-site" };
            var resolved = new Dictionary<string, string> { ["Creator.PAT"] = "real-token", ["Creator.Name"] = "my-site" };
            var output = new Dictionary<string, string> { ["Netlify.PAT"] = "real-token", ["Netlify.SiteId"] = "abc123" };

            SecretReferenceParser.RestoreReferences(original, resolved, output);

            Assert.Equal("${env:XSTATIC_NETLIFY}", output["Netlify.PAT"]);
            Assert.Equal("abc123", output["Netlify.SiteId"]);
        }

        [Fact]
        public void RestoreReferences_LeavesOutputAloneWhenNothingWasAReference()
        {
            var original = new Dictionary<string, string> { ["Creator.PAT"] = "real-token" };
            var output = new Dictionary<string, string> { ["Netlify.PAT"] = "real-token" };

            SecretReferenceParser.RestoreReferences(original, new Dictionary<string, string>(original), output);

            Assert.Equal("real-token", output["Netlify.PAT"]);
        }

        [Fact]
        public void RestoreReferences_MatchesValuesTheCreatorTrimmed()
        {
            var original = new Dictionary<string, string> { ["Creator.Token"] = "${env:XSTATIC_TOKEN}" };
            var resolved = new Dictionary<string, string> { ["Creator.Token"] = "  real-token \n" };
            var output = new Dictionary<string, string> { ["Target.Token"] = "real-token" };

            SecretReferenceParser.RestoreReferences(original, resolved, output);

            Assert.Equal("${env:XSTATIC_TOKEN}", output["Target.Token"]);
        }

        [Fact]
        public void RestoreReferences_PrefersTheSameKeyWhenTwoReferencesResolveToTheSameValue()
        {
            var original = new Dictionary<string, string> { ["A"] = "${env:XSTATIC_A}", ["B"] = "${env:XSTATIC_B}" };
            var resolved = new Dictionary<string, string> { ["A"] = "same", ["B"] = "same" };
            var output = new Dictionary<string, string> { ["A"] = "same", ["B"] = "same", ["C"] = "same" };

            SecretReferenceParser.RestoreReferences(original, resolved, output);

            Assert.Equal("${env:XSTATIC_A}", output["A"]);
            Assert.Equal("${env:XSTATIC_B}", output["B"]);
            Assert.Equal("${env:XSTATIC_A}", output["C"]);
        }

        [Fact]
        public void RestoreReferences_KeepsEscapes()
        {
            var original = new Dictionary<string, string> { ["Creator.Note"] = "$${env:NOT_A_SECRET}" };
            var resolved = new Dictionary<string, string> { ["Creator.Note"] = "${env:NOT_A_SECRET}" };
            var output = new Dictionary<string, string> { ["Target.Note"] = "${env:NOT_A_SECRET}" };

            SecretReferenceParser.RestoreReferences(original, resolved, output);

            Assert.Equal("$${env:NOT_A_SECRET}", output["Target.Note"]);
        }

        [Theory]
        [InlineData("XSTATIC_TOKEN", "XSTATIC_*", true)]
        [InlineData("xstatic_token", "XSTATIC_*", true)]
        [InlineData("NETLIFY_TOKEN", "XSTATIC_*", false)]
        [InlineData("ANYTHING", "*", true)]
        [InlineData("AB", "A?", true)]
        [InlineData("ABC", "A?", false)]
        [InlineData("A_MIDDLE_Z", "A*Z", true)]
        [InlineData("A_MIDDLE_Y", "A*Z", false)]
        [InlineData("XStatic:Secrets:Netlify", "XStatic:Secrets:*", true)]
        [InlineData("ConnectionStrings:umbracoDbDSN", "XStatic:Secrets:*", false)]
        public void SecretNamePattern_MatchesWildcards(string name, string pattern, bool expected)
        {
            Assert.Equal(expected, SecretNamePattern.IsMatch(name, pattern));
        }

        [Fact]
        public void SecretNamePattern_IsAllowedWhenAnyPatternMatches()
        {
            Assert.True(SecretNamePattern.IsAllowed("GIT_TOKEN", new[] { "XSTATIC_*", " GIT_* " }));
            Assert.False(SecretNamePattern.IsAllowed("GIT_TOKEN", Enumerable.Empty<string>()));
            Assert.False(SecretNamePattern.IsAllowed("GIT_TOKEN", new[] { "", "  " }));
        }
    }
}
