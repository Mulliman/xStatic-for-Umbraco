using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.Models.PublishedContent;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.AutoPublish;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Models;
using XStatic.Core.Repositories;
using Xunit;

namespace XStatic.Core.Tests.AutoPublish
{
    public class AutoPublishSiteResolverTests
    {
        [Fact]
        public void PathBasedResolver_MatchesSiteRootAndDescendantsOnly()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var site2 = new ExtendedGeneratedSite { Id = 2, Name = "Site 2" };

            var siteRoots = new Dictionary<int, IPublishedContent>
            {
                [1] = CreatePublishedContent(100),
                [2] = CreatePublishedContent(200)
            };

            var publishedPage = CreateContent(105, "-1,100,105", "contentPage");
            var unrelatedLibraryItem = CreateContent(901, "-1,900,901", "sharedBanner");

            var resolver = new PathBasedAutoPublishSiteResolver();

            var affectedForPage = resolver.ResolveAffectedSites(new[] { publishedPage }, new[] { site1, site2 }, siteRoots).ToList();
            Assert.Single(affectedForPage);
            Assert.Equal(1, affectedForPage[0].Id);

            var affectedForLibrary = resolver.ResolveAffectedSites(new[] { unrelatedLibraryItem }, new[] { site1, site2 }, siteRoots).ToList();
            Assert.Empty(affectedForLibrary);
        }

        [Fact]
        public void RelationBasedResolver_ResolvesSiteWhenSharedLibraryElementIsReferencedByPage()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var site2 = new ExtendedGeneratedSite { Id = 2, Name = "Site 2" };
            var siteRoots = new Dictionary<int, IPublishedContent>
            {
                [1] = CreatePublishedContent(100),
                [2] = CreatePublishedContent(200)
            };

            // Library element (901) -> nested library component (902) -> page in Site 2 (205)
            var libraryElement = CreateContent(901, "-1,900,901", "reusableCta");
            var nestedComponent = CreateContent(902, "-1,900,902", "reusableHero");
            var referencingPage = CreateContent(205, "-1,200,205", "landingPage");

            var relationService = new Mock<IRelationService>();
            relationService.Setup(r => r.GetByChildId(901)).Returns(new[] { CreateRelation(parentId: 902, childId: 901) });
            relationService.Setup(r => r.GetByChildId(902)).Returns(new[] { CreateRelation(parentId: 205, childId: 902) });
            relationService.Setup(r => r.GetByChildId(205)).Returns(Enumerable.Empty<IRelation>());

            var contentService = new Mock<IContentService>();
            contentService.Setup(c => c.GetById(902)).Returns(nestedComponent);
            contentService.Setup(c => c.GetById(205)).Returns(referencingPage);

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings()));

            var affected = resolver.ResolveAffectedSites(new[] { libraryElement }, new[] { site1, site2 }, siteRoots).ToList();

            Assert.Single(affected);
            Assert.Equal(2, affected[0].Id);
        }

        [Fact]
        public void RelationBasedResolver_HandlesCyclesSafelyWithoutInfiniteLoop()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var siteRoots = new Dictionary<int, IPublishedContent> { [1] = CreatePublishedContent(100) };

            var itemA = CreateContent(901, "-1,900,901", "sharedElement");
            var itemB = CreateContent(902, "-1,900,902", "sharedElement");

            var relationService = new Mock<IRelationService>();
            relationService.Setup(r => r.GetByChildId(901)).Returns(new[] { CreateRelation(902, 901) });
            relationService.Setup(r => r.GetByChildId(902)).Returns(new[] { CreateRelation(901, 902) });

            var contentService = new Mock<IContentService>();
            contentService.Setup(c => c.GetById(901)).Returns(itemA);
            contentService.Setup(c => c.GetById(902)).Returns(itemB);

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings { AutoPublishMaxRelationDepth = 10 }));

            var affected = resolver.ResolveAffectedSites(new[] { itemA }, new[] { site1 }, siteRoots).ToList();

            Assert.Empty(affected);
        }

        [Fact]
        public void RelationBasedResolver_TriggersAllSitesForConfiguredGlobalContentTypes()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var site2 = new ExtendedGeneratedSite { Id = 2, Name = "Site 2" };
            var siteRoots = new Dictionary<int, IPublishedContent>
            {
                [1] = CreatePublishedContent(100),
                [2] = CreatePublishedContent(200)
            };

            var globalFooter = CreateContent(950, "-1,900,950", "globalFooterElement");

            var resolver = new RelationBasedAutoPublishSiteResolver(
                Mock.Of<IRelationService>(),
                Mock.Of<IContentService>(),
                Options.Create(new XStaticGlobalSettings
                {
                    AutoPublishGlobalContentTypes = new List<string> { "globalFooterElement" }
                }));

            var affected = resolver.ResolveAffectedSites(new[] { globalFooter }, new[] { site1, site2 }, siteRoots).ToList();

            Assert.Equal(2, affected.Count);
        }

        [Fact]
        public void RelationBasedResolver_WhenDisabledInSettings_ReturnsEmpty()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var siteRoots = new Dictionary<int, IPublishedContent> { [1] = CreatePublishedContent(100) };
            var globalFooter = CreateContent(950, "-1,900,950", "globalFooterElement");

            var resolver = new RelationBasedAutoPublishSiteResolver(
                Mock.Of<IRelationService>(),
                Mock.Of<IContentService>(),
                Options.Create(new XStaticGlobalSettings
                {
                    EnableRelationBasedAutoPublish = false,
                    AutoPublishGlobalContentTypes = new List<string> { "globalFooterElement" }
                }));

            var affected = resolver.ResolveAffectedSites(new[] { globalFooter }, new[] { site1 }, siteRoots).ToList();

            Assert.Empty(affected);
        }

        [Fact]
        public void DefaultAutoPublisher_CombinesAndDeduplicatesSitesAcrossMultipleResolvers()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var site2 = new ExtendedGeneratedSite { Id = 2, Name = "Site 2" };

            var resolverA = new Mock<IAutoPublishSiteResolver>();
            resolverA.Setup(r => r.ResolveAffectedSites(
                    It.IsAny<IEnumerable<IContent>>(),
                    It.IsAny<IReadOnlyCollection<ExtendedGeneratedSite>>(),
                    It.IsAny<IReadOnlyDictionary<int, IPublishedContent>>()))
                .Returns(new[] { site1 });

            var resolverB = new Mock<IAutoPublishSiteResolver>();
            resolverB.Setup(r => r.ResolveAffectedSites(
                    It.IsAny<IEnumerable<IContent>>(),
                    It.IsAny<IReadOnlyCollection<ExtendedGeneratedSite>>(),
                    It.IsAny<IReadOnlyDictionary<int, IPublishedContent>>()))
                .Returns(new[] { site1, site2 });

            var publisher = new DefaultAutoPublisher(
                Mock.Of<ISitesRepository>(),
                Mock.Of<IUmbracoContextFactory>(),
                Mock.Of<IDeployerService>(),
                Mock.Of<IDeploymentTargetRepository>(),
                Mock.Of<IStaticSiteStorer>(),
                Mock.Of<IExportTypeService>(),
                Mock.Of<IWebHostEnvironment>(),
                Mock.Of<IActionFactory>(),
                Options.Create(new XStaticGlobalSettings()),
                Mock.Of<ILogger<DefaultAutoPublisher>>(),
                new[] { resolverA.Object, resolverB.Object });

            var resolved = publisher.ResolveAffectedSites(
                new[] { CreateContent(901, "-1,900,901", "sharedBanner") },
                new[] { site1, site2 },
                new Dictionary<int, IPublishedContent>());

            Assert.Equal(2, resolved.Count);
            Assert.Contains(resolved, s => s.Id == 1);
            Assert.Contains(resolved, s => s.Id == 2);
        }

        private static IPublishedContent CreatePublishedContent(int id)
        {
            var mock = new Mock<IPublishedContent>();
            mock.SetupGet(x => x.Id).Returns(id);
            return mock.Object;
        }

        private static IContent CreateContent(int id, string path, string contentTypeAlias)
        {
            var contentType = new Mock<ISimpleContentType>();
            contentType.SetupGet(x => x.Alias).Returns(contentTypeAlias);

            var content = new Mock<IContent>();
            content.SetupGet(x => x.Id).Returns(id);
            content.SetupGet(x => x.Path).Returns(path);
            content.SetupGet(x => x.ContentType).Returns(contentType.Object);
            return content.Object;
        }

        private static IRelation CreateRelation(int parentId, int childId)
        {
            var relation = new Mock<IRelation>();
            relation.SetupGet(r => r.ParentId).Returns(parentId);
            relation.SetupGet(r => r.ChildId).Returns(childId);
            return relation.Object;
        }
    }
}
