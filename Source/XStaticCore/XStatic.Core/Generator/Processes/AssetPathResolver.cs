using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Logging;
using XStatic.Core.Generator.Jobs;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator.Processes
{
    /// <summary>
    /// Resolves a site's configured asset paths against the web root and content root,
    /// adding what it finds to a <see cref="JobBuilder"/>. Paths that can't be found are
    /// reported as failed results rather than aborting the whole generation.
    /// </summary>
    public class AssetPathResolver
    {
        public const string ResultType = "Asset";

        private readonly string _webRootPath;
        private readonly string _contentRootPath;
        private readonly ILogger _logger;

        public AssetPathResolver(string webRootPath, string contentRootPath, ILogger logger = null)
        {
            _webRootPath = webRootPath;
            _contentRootPath = contentRootPath;
            _logger = logger;
        }

        public List<GenerateItemResult> AddAssetsToBuilder(string assetPaths, JobBuilder builder)
        {
            var results = new List<GenerateItemResult>();

            if (string.IsNullOrWhiteSpace(assetPaths))
            {
                return results;
            }

            var splitPaths = assetPaths.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(p => p.Trim())
                .Where(p => p.Length > 0);

            foreach (var path in splitPaths)
            {
                try
                {
                    if (!TryAddPath(path, builder))
                    {
                        results.Add(NotFound(path));
                    }
                }
                catch (Exception e)
                {
                    _logger?.LogWarning(e, "xStatic could not add asset path {AssetPath}", path);
                    results.Add(GenerateItemResult.Error(ResultType, path, e.Message));
                }
            }

            return results;
        }

        private bool TryAddPath(string path, JobBuilder builder)
        {
            if (path.Contains("?") || path.Contains("*"))
            {
                return TryAddWildcardPath(path, builder);
            }

            var absolutePathWww = CombineOrNull(_webRootPath, path);
            var absolutePathContent = CombineOrNull(_contentRootPath, path);

            if (absolutePathWww != null && Directory.Exists(absolutePathWww))
            {
                builder.AddAssetFolder(absolutePathWww, path);
            }
            else if (absolutePathContent != null && Directory.Exists(absolutePathContent))
            {
                builder.AddAssetFolder(absolutePathContent, path);
            }
            else if (absolutePathWww != null && File.Exists(absolutePathWww))
            {
                builder.AddAssetFile(absolutePathWww, path);
            }
            else if (absolutePathContent != null && File.Exists(absolutePathContent))
            {
                builder.AddAssetFile(absolutePathContent, path);
            }
            else
            {
                return false;
            }

            return true;
        }

        private bool TryAddWildcardPath(string path, JobBuilder builder)
        {
            var trimmedPath = path.TrimStart('\\', '/');
            var directoryPart = Path.GetDirectoryName(trimmedPath) ?? string.Empty;

            foreach (var root in new[] { _webRootPath, _contentRootPath })
            {
                var testPath = CombineOrNull(root, directoryPart);

                if (testPath == null || !Directory.Exists(testPath))
                {
                    continue;
                }

                var files = new DirectoryInfo(root).GetFiles(trimmedPath, SearchOption.AllDirectories);

                builder.AddAssetFiles(files.ToDictionary(f => f.FullName, f => "/" + FileHelpers.GetRelativePath(root, f.FullName)));

                return true;
            }

            return false;
        }

        private GenerateItemResult NotFound(string path)
        {
            _logger?.LogWarning("xStatic asset path {AssetPath} was not found in the web root or content root and has been skipped", path);

            return GenerateItemResult.Error(ResultType, path, $"Asset path '{path}' not found");
        }

        private static string CombineOrNull(string root, string path)
        {
            return string.IsNullOrEmpty(root) ? null : FileHelpers.PathCombine(root, path);
        }
    }
}
