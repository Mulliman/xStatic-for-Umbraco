using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Umbraco.Cms.Core;
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
            contentService.Setup(c => c.GetByIds(It.IsAny<IEnumerable<int>>()))
                .Returns((IEnumerable<int> ids) => ids.Select(id => id switch
                {
                    902 => nestedComponent,
                    205 => referencingPage,
                    _ => null!
                }).Where(x => x != null));

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings { EnableRelationBasedAutoPublish = true }));

            var affected = resolver.ResolveAffectedSites(new[] { libraryElement }, new[] { site1, site2 }, siteRoots).ToList();

            Assert.Single(affected);
            Assert.Equal(2, affected[0].Id);
        }

        [Fact]
        public void RelationBasedResolver_IgnoresNonReferenceRelationsSuchAsRelateDocumentOnCopy()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var siteRoots = new Dictionary<int, IPublishedContent> { [1] = CreatePublishedContent(100) };

            var copiedPage = CreateContent(205, "-1,200,205", "contentPage");
            var originalPage = CreateContent(105, "-1,100,105", "contentPage");

            var relationService = new Mock<IRelationService>();
            relationService.Setup(r => r.GetByChildId(205)).Returns(new[]
            {
                CreateRelation(parentId: 105, childId: 205, relationTypeAlias: Constants.Conventions.RelationTypes.RelateDocumentOnCopyAlias)
            });

            var contentService = new Mock<IContentService>();
            contentService.Setup(c => c.GetByIds(It.IsAny<IEnumerable<int>>())).Returns(new[] { originalPage });

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings { EnableRelationBasedAutoPublish = true }));

            var affected = resolver.ResolveAffectedSites(new[] { copiedPage }, new[] { site1 }, siteRoots).ToList();

            Assert.Empty(affected);
        }

        [Fact]
        public void RelationBasedResolver_EnforcesMaxRelationDepth()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var siteRoots = new Dictionary<int, IPublishedContent> { [1] = CreatePublishedContent(100) };

            // 2-hop chain: 901 -> 902 -> 105, with maxDepth = 1 so 105 must not be reached
            var item901 = CreateContent(901, "-1,900,901", "el");
            var item902 = CreateContent(902, "-1,900,902", "el");
            var page105 = CreateContent(105, "-1,100,105", "page");

            var relationService = new Mock<IRelationService>();
            relationService.Setup(r => r.GetByChildId(901)).Returns(new[] { CreateRelation(902, 901) });
            relationService.Setup(r => r.GetByChildId(902)).Returns(new[] { CreateRelation(105, 902) });

            var contentService = new Mock<IContentService>();
            contentService.Setup(c => c.GetByIds(It.IsAny<IEnumerable<int>>()))
                .Returns((IEnumerable<int> ids) => ids.Select(id => id == 902 ? item902 : page105));

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings
                {
                    EnableRelationBasedAutoPublish = true,
                    AutoPublishMaxRelationDepth = 1
                }));

            var affected = resolver.ResolveAffectedSites(new[] { item901 }, new[] { site1 }, siteRoots).ToList();

            Assert.Empty(affected);
        }

        [Fact]
        public void RelationBasedResolver_IgnoresTrashedReferencingParents()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var siteRoots = new Dictionary<int, IPublishedContent> { [1] = CreatePublishedContent(100) };

            var sharedItem = CreateContent(901, "-1,900,901", "sharedEl");
            var trashedPage = CreateContent(105, "-1,-20,100,105", "contentPage", trashed: true);

            var relationService = new Mock<IRelationService>();
            relationService.Setup(r => r.GetByChildId(901)).Returns(new[] { CreateRelation(105, 901) });

            var contentService = new Mock<IContentService>();
            contentService.Setup(c => c.GetByIds(It.IsAny<IEnumerable<int>>())).Returns(new[] { trashedPage });

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings { EnableRelationBasedAutoPublish = true }));

            var affected = resolver.ResolveAffectedSites(new[] { sharedItem }, new[] { site1 }, siteRoots).ToList();

            Assert.Empty(affected);
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
            contentService.Setup(c => c.GetByIds(It.IsAny<IEnumerable<int>>()))
                .Returns((IEnumerable<int> ids) => ids.Select(id => id == 901 ? itemA : itemB));

            var resolver = new RelationBasedAutoPublishSiteResolver(
                relationService.Object,
                contentService.Object,
                Options.Create(new XStaticGlobalSettings
                {
                    EnableRelationBasedAutoPublish = true,
                    AutoPublishMaxRelationDepth = 10
                }));

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
                    EnableRelationBasedAutoPublish = true,
                    AutoPublishGlobalContentTypes = new List<string> { "globalFooterElement" }
                }));

            var affected = resolver.ResolveAffectedSites(new[] { globalFooter }, new[] { site1, site2 }, siteRoots).ToList();

            Assert.Equal(2, affected.Count);
        }

        [Fact]
        public void RelationBasedResolver_IsDisabledByDefaultOnLts()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var siteRoots = new Dictionary<int, IPublishedContent> { [1] = CreatePublishedContent(100) };
            var globalFooter = CreateContent(950, "-1,900,950", "globalFooterElement");

            var resolver = new RelationBasedAutoPublishSiteResolver(
                Mock.Of<IRelationService>(),
                Mock.Of<IContentService>(),
                Options.Create(new XStaticGlobalSettings
                {
                    AutoPublishGlobalContentTypes = new List<string> { "globalFooterElement" }
                }));

            var affected = resolver.ResolveAffectedSites(new[] { globalFooter }, new[] { site1 }, siteRoots).ToList();

            Assert.Empty(affected);
        }

        [Fact]
        public void DefaultAutoPublisher_CombinesDeduplicatesAndShortCircuitsAcrossResolvers()
        {
            var site1 = new ExtendedGeneratedSite { Id = 1, Name = "Site 1" };
            var site2 = new ExtendedGeneratedSite { Id = 2, Name = "Site 2" };

            var resolverA = new Mock<IAutoPublishSiteResolver>();
            resolverA.Setup(r => r.ResolveAffectedSites(
                    It.IsAny<IEnumerable<IContent>>(),
                    It.IsAny<IReadOnlyCollection<ExtendedGeneratedSite>>(),
                    It.IsAny<IReadOnlyDictionary<int, IPublishedContent>>()))
                .Returns(new[] { site1, site2 });

            var resolverB = new Mock<IAutoPublishSiteResolver>();

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
            // All sites already matched by resolverA, so resolverB must be skipped.
            resolverB.Verify(r => r.ResolveAffectedSites(
                It.IsAny<IEnumerable<IContent>>(),
                It.IsAny<IReadOnlyCollection<ExtendedGeneratedSite>>(),
                It.IsAny<IReadOnlyDictionary<int, IPublishedContent>>()), Times.Never);
        }

        [Fact]
        public void ServiceCollection_ResolvesDefaultAutoPublisherWithRegisteredSiteResolversAndKeepsLegacyCtor()
        {
            // Verify legacy 10-arg constructor remains callable for binary compatibility.
            var legacyInstance = new DefaultAutoPublisher(
                Mock.Of<ISitesRepository>(),
                Mock.Of<IUmbracoContextFactory>(),
                Mock.Of<IDeployerService>(),
                Mock.Of<IDeploymentTargetRepository>(),
                Mock.Of<IStaticSiteStorer>(),
                Mock.Of<IExportTypeService>(),
                Mock.Of<IWebHostEnvironment>(),
                Mock.Of<IActionFactory>(),
                Options.Create(new XStaticGlobalSettings()),
                Mock.Of<ILogger<DefaultAutoPublisher>>());
            Assert.NotNull(legacyInstance);

            // Verify DI selects the 11-arg constructor and injects all registered resolvers without duplicates.
            var services = new ServiceCollection();
            services.AddSingleton(Mock.Of<ISitesRepository>());
            services.AddSingleton(Mock.Of<IUmbracoContextFactory>());
            services.AddSingleton(Mock.Of<IDeployerService>());
            services.AddSingleton(Mock.Of<IDeploymentTargetRepository>());
            services.AddSingleton(Mock.Of<IStaticSiteStorer>());
            services.AddSingleton(Mock.Of<IExportTypeService>());
            services.AddSingleton(Mock.Of<IWebHostEnvironment>());
            services.AddSingleton(Mock.Of<IActionFactory>());
            services.AddSingleton(Mock.Of<IRelationService>());
            services.AddSingleton(Mock.Of<IContentService>());
            services.AddSingleton(Mock.Of<ILogger<DefaultAutoPublisher>>());
            services.AddSingleton(Mock.Of<ILogger<RelationBasedAutoPublishSiteResolver>>());
            services.AddOptions<XStaticGlobalSettings>();

            var genBuilder = new GeneratorServiceBuilder(services);
            genBuilder.AddDefaultAutoDeployServices();
            genBuilder.AddDefaultAutoDeployServices(); // Calling twice must not register duplicate resolvers.

            using var provider = services.BuildServiceProvider();
            var publisher = provider.GetRequiredService<IAutoPublisher>();
            var resolvers = provider.GetServices<IAutoPublishSiteResolver>().ToList();

            Assert.IsType<DefaultAutoPublisher>(publisher);
            Assert.Equal(2, resolvers.Count);
            Assert.Contains(resolvers, r => r is PathBasedAutoPublishSiteResolver);
            Assert.Contains(resolvers, r => r is RelationBasedAutoPublishSiteResolver);
        }

        [Fact]
        public void ServiceCollection_ResolvesDefaultAutoPublisherWhenEntityServiceIsRegistered()
        {
            // In a real site IEntityService is registered, so DI picks the constructor that takes it.
            var services = new ServiceCollection();
            services.AddSingleton(Mock.Of<ISitesRepository>());
            services.AddSingleton(Mock.Of<IUmbracoContextFactory>());
            services.AddSingleton(Mock.Of<IDeployerService>());
            services.AddSingleton(Mock.Of<IDeploymentTargetRepository>());
            services.AddSingleton(Mock.Of<IStaticSiteStorer>());
            services.AddSingleton(Mock.Of<IExportTypeService>());
            services.AddSingleton(Mock.Of<IWebHostEnvironment>());
            services.AddSingleton(Mock.Of<IActionFactory>());
            services.AddSingleton(Mock.Of<IRelationService>());
            services.AddSingleton(Mock.Of<IContentService>());
            services.AddSingleton(Mock.Of<IEntityService>());
            services.AddSingleton(Mock.Of<ILogger<DefaultAutoPublisher>>());
            services.AddSingleton(Mock.Of<ILogger<RelationBasedAutoPublishSiteResolver>>());
            services.AddOptions<XStaticGlobalSettings>();
            new GeneratorServiceBuilder(services).AddDefaultAutoDeployServices();

            using var provider = services.BuildServiceProvider();

            Assert.IsType<DefaultAutoPublisher>(provider.GetRequiredService<IAutoPublisher>());
        }

        private static IPublishedContent CreatePublishedContent(int id)
        {
            var mock = new Mock<IPublishedContent>();
            mock.SetupGet(x => x.Id).Returns(id);
            return mock.Object;
        }

        private static IContent CreateContent(int id, string path, string contentTypeAlias, bool trashed = false)
        {
            var contentType = new Mock<ISimpleContentType>();
            contentType.SetupGet(x => x.Alias).Returns(contentTypeAlias);

            var content = new Mock<IContent>();
            content.SetupGet(x => x.Id).Returns(id);
            content.SetupGet(x => x.Path).Returns(path);
            content.SetupGet(x => x.Trashed).Returns(trashed);
            content.SetupGet(x => x.ContentType).Returns(contentType.Object);
            return content.Object;
        }

        private static IRelation CreateRelation(int parentId, int childId, string relationTypeAlias = Constants.Conventions.RelationTypes.RelatedDocumentAlias)
        {
            var relType = new Mock<IRelationType>();
            relType.SetupGet(t => t.Alias).Returns(relationTypeAlias);

            var relation = new Mock<IRelation>();
            relation.SetupGet(r => r.ParentId).Returns(parentId);
            relation.SetupGet(r => r.ChildId).Returns(childId);
            relation.SetupGet(r => r.RelationType).Returns(relType.Object);
            return relation.Object;
        }
    }
}
