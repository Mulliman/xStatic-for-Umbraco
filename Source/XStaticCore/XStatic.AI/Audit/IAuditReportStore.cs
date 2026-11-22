using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using XStatic.AI.Configuration;

namespace XStatic.AI.Audit;

/// <summary>
/// Persists and reads AI pre-deploy audit reports outside the deployable static site directory,
/// enforcing strict path-containment checks to prevent path traversal.
/// </summary>
public interface IAuditReportStore
{
    string GetSiteReportDirectory(int staticSiteId);

    Task<string> SaveReportAsync(
        int staticSiteId,
        string relativeReportPath,
        string markdownContent,
        AiAuditReport report,
        bool writeJsonReport,
        CancellationToken cancellationToken = default);

    LatestAuditMetadata? ReadLatestAuditMetadata(int staticSiteId);
}

/// <summary>
/// Safe, deterministic audit summary returned to agent tools (omits raw untrusted AI prose to prevent indirect prompt injection).
/// </summary>
public sealed record LatestAuditMetadata(
    DateTimeOffset GeneratedAtUtc,
    int AuditedPageCount,
    int TotalHtmlFilesDiscovered,
    int CriticalIssueCount,
    int WarningIssueCount,
    bool AiSummaryAvailable,
    string ReportFileName);

public class FileSystemAuditReportStore : IAuditReportStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly IWebHostEnvironment _webHostEnvironment;
    private readonly IOptions<XStaticAIOptions> _aiOptions;

    public FileSystemAuditReportStore(
        IWebHostEnvironment webHostEnvironment,
        IOptions<XStaticAIOptions> aiOptions)
    {
        _webHostEnvironment = webHostEnvironment ?? throw new ArgumentNullException(nameof(webHostEnvironment));
        _aiOptions = aiOptions ?? throw new ArgumentNullException(nameof(aiOptions));
    }

    public string GetSiteReportDirectory(int staticSiteId)
    {
        var configuredDir = string.IsNullOrWhiteSpace(_aiOptions.Value.AuditReportDirectory)
            ? "umbraco/Data/xStatic/reports"
            : _aiOptions.Value.AuditReportDirectory;

        var baseDir = Path.IsPathRooted(configuredDir)
            ? configuredDir
            : Path.Combine(_webHostEnvironment.ContentRootPath, configuredDir);

        return Path.GetFullPath(Path.Combine(baseDir, staticSiteId.ToString()));
    }

    public async Task<string> SaveReportAsync(
        int staticSiteId,
        string relativeReportPath,
        string markdownContent,
        AiAuditReport report,
        bool writeJsonReport,
        CancellationToken cancellationToken = default)
    {
        var siteReportDir = GetSiteReportDirectory(staticSiteId);
        var resolvedMarkdownPath = ResolveSafePath(siteReportDir, relativeReportPath);

        var utf8NoBom = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false);

        Directory.CreateDirectory(Path.GetDirectoryName(resolvedMarkdownPath)!);
        await File.WriteAllTextAsync(resolvedMarkdownPath, markdownContent, utf8NoBom, cancellationToken)
            .ConfigureAwait(false);

        if (writeJsonReport)
        {
            var jsonRelative = Path.ChangeExtension(relativeReportPath, ".json");
            var resolvedJsonPath = ResolveSafePath(siteReportDir, jsonRelative);
            var json = JsonSerializer.Serialize(report, JsonOptions);
            await File.WriteAllTextAsync(resolvedJsonPath, json, utf8NoBom, cancellationToken)
                .ConfigureAwait(false);
        }

        // Write a fixed pointer file so status tools can find the latest report even when a custom ReportPath is used
        var pointerPath = Path.Combine(siteReportDir, ".latest-audit.json");
        var metadata = new LatestAuditMetadata(
            GeneratedAtUtc: report.GeneratedAtUtc,
            AuditedPageCount: report.AuditedPageCount,
            TotalHtmlFilesDiscovered: report.TotalHtmlFilesDiscovered,
            CriticalIssueCount: report.CriticalIssueCount,
            WarningIssueCount: report.WarningIssueCount,
            AiSummaryAvailable: report.AiSummaryAvailable,
            ReportFileName: Path.GetRelativePath(siteReportDir, resolvedMarkdownPath).Replace('\\', '/'));

        await File.WriteAllTextAsync(pointerPath, JsonSerializer.Serialize(metadata, JsonOptions), utf8NoBom, cancellationToken)
            .ConfigureAwait(false);

        return resolvedMarkdownPath;
    }

    public LatestAuditMetadata? ReadLatestAuditMetadata(int staticSiteId)
    {
        var siteReportDir = GetSiteReportDirectory(staticSiteId);
        var pointerPath = Path.Combine(siteReportDir, ".latest-audit.json");
        if (!File.Exists(pointerPath))
        {
            return null;
        }

        try
        {
            var json = File.ReadAllText(pointerPath);
            return JsonSerializer.Deserialize<LatestAuditMetadata>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    internal static string ResolveSafePath(string rootDirectory, string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            throw new ArgumentException("Report path cannot be empty.", nameof(relativePath));
        }

        if (Path.IsPathRooted(relativePath))
        {
            throw new ArgumentException("Report path must be a relative path within the audit report directory.", nameof(relativePath));
        }

        var normalizedRoot = Path.GetFullPath(rootDirectory)
            .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var rootWithSep = normalizedRoot + Path.DirectorySeparatorChar;

        var candidate = Path.GetFullPath(Path.Combine(normalizedRoot, relativePath.TrimStart('/', '\\')));

        var comparison = OperatingSystem.IsWindows()
            ? StringComparison.OrdinalIgnoreCase
            : StringComparison.Ordinal;

        if (!candidate.StartsWith(rootWithSep, comparison))
        {
            throw new ArgumentException(
                "Report path escapes the configured audit report directory.",
                nameof(relativePath));
        }

        return candidate;
    }
}
