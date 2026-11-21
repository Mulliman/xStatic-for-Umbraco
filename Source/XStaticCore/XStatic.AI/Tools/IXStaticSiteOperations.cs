using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Web;
using XStatic.Core;
using XStatic.Core.Actions;
using XStatic.Core.App;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Processes;
using XStatic.Core.Deploy.Targets;
using XStatic.Core.Generator.ExportTypes;
using XStatic.Core.Generator.Processes;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Repositories;

namespace XStatic.AI.Tools;

/// <summary>
/// Abstraction over xStatic's site generation and deployment processes so AI agent tools
/// remain decoupled and easily unit-testable.
/// </summary>
public interface IXStaticSiteOperations
{
    Task<RebuildProcessResult> RebuildSiteAsync(int staticSiteId, CancellationToken cancellationToken = default);

    Task<XStaticResult> DeploySiteAsync(int staticSiteId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Default implementation delegating to xStatic's <see cref="RebuildProcess"/> and <see cref="DeployProcess"/>.
/// </summary>
public class XStaticSiteOperations : IXStaticSiteOperations
{
    private readonly IUmbracoContextFactory _umbracoContextFactory;
    private readonly IExportTypeService _exportTypeService;
    private readonly ISitesRepository _sitesRepository;
    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IActionFactory _actionFactory;
    private readonly IOptions<XStaticGlobalSettings> _globalSettings;
    private readonly IStaticSiteStorer _staticSiteStorer;
    private readonly IDeploymentTargetRepository _deploymentTargetRepository;
    private readonly IDeployerService _deployerService;
    private readonly ILogger<XStaticSiteOperations> _logger;

    public XStaticSiteOperations(
        IUmbracoContextFactory umbracoContextFactory,
        IExportTypeService exportTypeService,
        ISitesRepository sitesRepository,
        IWebHostEnvironment webHostEnvironment,
        IActionFactory actionFactory,
        IOptions<XStaticGlobalSettings> globalSettings,
        IStaticSiteStorer staticSiteStorer,
        IDeploymentTargetRepository deploymentTargetRepository,
        IDeployerService deployerService,
        ILogger<XStaticSiteOperations> logger)
    {
        _umbracoContextFactory = umbracoContextFactory ?? throw new ArgumentNullException(nameof(umbracoContextFactory));
        _exportTypeService = exportTypeService ?? throw new ArgumentNullException(nameof(exportTypeService));
        _sitesRepository = sitesRepository ?? throw new ArgumentNullException(nameof(sitesRepository));
        _webHostEnvironment = webHostEnvironment ?? throw new ArgumentNullException(nameof(webHostEnvironment));
        _actionFactory = actionFactory ?? throw new ArgumentNullException(nameof(actionFactory));
        _globalSettings = globalSettings ?? throw new ArgumentNullException(nameof(globalSettings));
        _staticSiteStorer = staticSiteStorer ?? throw new ArgumentNullException(nameof(staticSiteStorer));
        _deploymentTargetRepository = deploymentTargetRepository ?? throw new ArgumentNullException(nameof(deploymentTargetRepository));
        _deployerService = deployerService ?? throw new ArgumentNullException(nameof(deployerService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<RebuildProcessResult> RebuildSiteAsync(int staticSiteId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var process = new RebuildProcess(
            _umbracoContextFactory,
            _exportTypeService,
            _sitesRepository,
            _webHostEnvironment,
            _actionFactory,
            _globalSettings,
            _logger);

        return await process.RebuildSite(staticSiteId).ConfigureAwait(false);
    }

    public async Task<XStaticResult> DeploySiteAsync(int staticSiteId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var process = new DeployProcess(
            _staticSiteStorer,
            _deploymentTargetRepository,
            _deployerService,
            _sitesRepository);

        return await process.DeployStaticSite(staticSiteId).ConfigureAwait(false);
    }
}
