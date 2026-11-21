namespace XStatic.AI.Configuration;

/// <summary>
/// Configuration options for the optional <c>XStatic.AI</c> package.
/// Bound from the <c>XStatic:AI</c> configuration section.
/// </summary>
public class XStaticAIOptions
{
    public const string SectionName = "XStatic:AI";

    /// <summary>
    /// Optional profile alias when integrating with <c>Umbraco.AI</c> profiles.
    /// Passed to custom <see cref="IXStaticChatClientResolver"/> factories when resolving an <see cref="Microsoft.Extensions.AI.IChatClient"/>.
    /// </summary>
    public string? ProfileAlias { get; set; }

    /// <summary>
    /// Maximum number of generated HTML pages to include in a single pre-deploy GEO/SEO audit run.
    /// </summary>
    public int DefaultMaxPagesToAudit { get; set; } = 10;

    /// <summary>
    /// Maximum number of plain-text characters extracted per page when building the LLM prompt.
    /// </summary>
    public int MaxCharactersPerPage { get; set; } = 4000;

    /// <summary>
    /// Minimum visible word count before a page is flagged as thin content.
    /// </summary>
    public int ThinContentWordThreshold { get; set; } = 150;

    /// <summary>
    /// Relative path inside the generated site folder where the Markdown audit report is written.
    /// </summary>
    public string DefaultReportFileName { get; set; } = ".xstatic-ai-audit.md";

    /// <summary>
    /// When <c>true</c>, also writes a machine-readable JSON companion report alongside the Markdown report.
    /// </summary>
    public bool WriteJsonReport { get; set; } = true;

    /// <summary>
    /// When <c>true</c>, the pre-deploy audit action returns an error result if critical issues are found.
    /// </summary>
    public bool FailOnCriticalIssues { get; set; }

    /// <summary>
    /// When <c>true</c>, agent tool invocations enforce authentication and xStatic role checks
    /// (<see cref="XStatic.Security.XStaticRoles"/>) matching xStatic's backoffice authorization policies.
    /// </summary>
    public bool RequireUserRoleAuthorization { get; set; } = true;
}
