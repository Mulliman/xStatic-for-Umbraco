using Microsoft.Extensions.AI;

namespace XStatic.AI.Tools;

/// <summary>
/// Exposes xStatic capabilities as standard <c>Microsoft.Extensions.AI</c> <see cref="AIFunction"/> /
/// <see cref="AITool"/> instances that can be attached directly to <c>Umbraco.AI.Agent</c> or any
/// <see cref="IChatClient"/> pipeline using <see cref="ChatOptions.Tools"/>.
/// </summary>
public interface IXStaticAIToolProvider
{
    IReadOnlyList<AIFunction> GetFunctions();

    IReadOnlyList<AITool> GetAITools();

    ChatOptions ConfigureChatOptions(ChatOptions? options = null);
}

/// <summary>
/// Default <see cref="IXStaticAIToolProvider"/> wrapping <see cref="XStaticAgentTools"/> via <see cref="AIFunctionFactory"/>.
/// </summary>
public class XStaticAIToolProvider : IXStaticAIToolProvider
{
    private readonly XStaticAgentTools _agentTools;

    public XStaticAIToolProvider(XStaticAgentTools agentTools)
    {
        _agentTools = agentTools ?? throw new ArgumentNullException(nameof(agentTools));
    }

    public IReadOnlyList<AIFunction> GetFunctions()
    {
        return
        [
            AIFunctionFactory.Create(
                _agentTools.ListSites,
                name: XStaticAgentTools.ListSitesToolName,
                description: "Lists all configured xStatic static sites with IDs, names, hostnames, and last generation/deployment timestamps."),

            AIFunctionFactory.Create(
                _agentTools.GetSiteStatus,
                name: XStaticAgentTools.GetSiteStatusToolName,
                description: "Gets generation status, metadata, generated HTML page count, and latest AI audit report for a specific xStatic site ID."),

            AIFunctionFactory.Create(
                _agentTools.GenerateSiteAsync,
                name: XStaticAgentTools.GenerateSiteToolName,
                description: "Triggers static site generation (build) for the specified xStatic site ID."),

            AIFunctionFactory.Create(
                _agentTools.DeploySiteAsync,
                name: XStaticAgentTools.DeploySiteToolName,
                description: "Deploys the generated static output for the specified xStatic site ID to its configured deployment target.")
        ];
    }

    public IReadOnlyList<AITool> GetAITools() => GetFunctions().Cast<AITool>().ToList();

    public ChatOptions ConfigureChatOptions(ChatOptions? options = null)
    {
        options ??= new ChatOptions();
        options.Tools ??= new List<AITool>();

        foreach (var tool in GetAITools())
        {
            if (options.Tools.All(existing => !string.Equals(existing.Name, tool.Name, StringComparison.OrdinalIgnoreCase)))
            {
                options.Tools.Add(tool);
            }
        }

        return options;
    }
}
