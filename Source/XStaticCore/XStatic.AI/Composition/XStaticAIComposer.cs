using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using XStatic.AI.Audit;
using XStatic.AI.Configuration;
using XStatic.AI.Security;
using XStatic.AI.Tools;

namespace XStatic.AI.Composition;

public static class XStaticAIServiceCollectionExtensions
{
    /// <summary>
    /// Registers <c>XStatic.AI</c> services, <c>Microsoft.Extensions.AI</c> agent tools,
    /// role-based tool authorization, and the <see cref="AiPreDeployAuditAction"/> post-generation action.
    /// </summary>
    public static IServiceCollection AddXStaticAI(
        this IServiceCollection services,
        Action<XStaticAIOptions>? configure = null)
    {
        services.AddOptions<XStaticAIOptions>()
            .BindConfiguration(XStaticAIOptions.SectionName);

        if (configure is not null)
        {
            services.Configure(configure);
        }

        services.TryAddSingleton<IXStaticChatClientResolver, DefaultXStaticChatClientResolver>();
        services.TryAddSingleton<IXStaticToolAuthorizationService, XStaticToolAuthorizationService>();
        services.TryAddSingleton<IXStaticSiteOperations, XStaticSiteOperations>();
        services.TryAddSingleton<XStaticAgentTools>();
        services.TryAddSingleton<IXStaticAIToolProvider, XStaticAIToolProvider>();

        services.TryAddSingleton<IPageSignalExtractor, HtmlPageSignalExtractor>();
        services.TryAddSingleton<IAuditReportStore, FileSystemAuditReportStore>();
        services.TryAddSingleton<IGeoSeoAuditService, GeoSeoAuditService>();
        services.TryAddTransient<AiPreDeployAuditAction>();

        return services;
    }

    /// <summary>
    /// Registers a custom profile-aware <see cref="IChatClient"/> resolver delegate.
    /// Ideal for bridging <c>Umbraco.AI</c> chat client profiles into <c>XStatic.AI</c>.
    /// </summary>
    public static IServiceCollection AddXStaticAIChatClient(
        this IServiceCollection services,
        XStaticChatClientFactory chatClientFactory)
    {
        ArgumentNullException.ThrowIfNull(chatClientFactory);

        services.Replace(ServiceDescriptor.Singleton(chatClientFactory));
        services.TryAddSingleton<IXStaticChatClientResolver, DefaultXStaticChatClientResolver>();

        return services;
    }
}

/// <summary>
/// Umbraco composer that automatically registers <c>XStatic.AI</c> services unless already configured manually.
/// </summary>
public class XStaticAIComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        var isManuallyInstalled = builder.Services.Any(x => x.ServiceType == typeof(IXStaticAIToolProvider));
        if (!isManuallyInstalled)
        {
            builder.Services.AddXStaticAI();
        }
    }
}
