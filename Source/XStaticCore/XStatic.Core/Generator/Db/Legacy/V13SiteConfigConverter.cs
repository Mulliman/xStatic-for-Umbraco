using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using XStatic.Core.Deploy.Targets.Db;

namespace XStatic.Core.Generator.Db.Legacy
{
    /// <summary>
    /// Converts xStatic 13 site configs into the 14+ model. Pure logic so it can be unit tested;
    /// the database work happens in the migration that calls it.
    /// </summary>
    public static class V13SiteConfigConverter
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

        /// <summary>
        /// All content/media node int ids the row references, so they can be resolved to keys in one query.
        /// </summary>
        public static IEnumerable<int> GetReferencedNodeIds(V13SiteConfigRow row)
        {
            if (TryParseInt(row.RootNode, out var rootId))
            {
                yield return rootId;
            }

            foreach (var part in SplitList(row.MediaRootNodes))
            {
                if (TryParseInt(part, out var mediaId))
                {
                    yield return mediaId;
                }
            }
        }

        /// <summary>
        /// Converts a v13 row. Returns null when the root node can't be resolved (e.g. it has since been deleted).
        /// Media roots that can't be resolved are dropped.
        /// </summary>
        public static SiteConfig ConvertSite(V13SiteConfigRow row, IReadOnlyDictionary<int, Guid> nodeKeys, int? deploymentTargetId)
        {
            var rootKey = ResolveKey(row.RootNode, nodeKeys);
            if (rootKey == null)
            {
                return null;
            }

            var mediaKeys = SplitList(row.MediaRootNodes)
                .Select(x => ResolveKey(x, nodeKeys))
                .Where(x => x.HasValue)
                .Select(x => x.Value)
                .Distinct()
                .ToList();

            return new SiteConfig
            {
                Name = row.Name,
                AutoPublish = row.AutoPublish,
                RootNode = rootKey.Value,
                MediaRootNodes = SiteConfig.SerializeMediaRootNodes(mediaKeys),
                ExportFormat = row.ExportFormat,
                LastRun = row.LastRun,
                LastBuildDurationInSeconds = row.LastBuildDurationInSeconds,
                LastDeployed = row.LastDeployed,
                LastDeployDurationInSeconds = row.LastDeployDurationInSeconds,
                AssetPaths = row.AssetPaths,
                TargetHostname = row.TargetHostname,
                ImageCrops = row.ImageCrops,
                DeploymentTarget = deploymentTargetId,
                PostGenerationActionIds = ParseIntList(row.PostGenerationActionIds),
                Cultures = new List<string>()
            };
        }

        /// <summary>
        /// Converts the v13 inline deployer JSON into a standalone deployment target. Returns null if there isn't one.
        /// </summary>
        public static DeploymentTargetDataModel ConvertDeploymentTarget(string deploymentTargetJson, string siteName)
        {
            if (string.IsNullOrWhiteSpace(deploymentTargetJson))
            {
                return null;
            }

            LegacyDeploymentTarget legacy;
            try
            {
                legacy = JsonSerializer.Deserialize<LegacyDeploymentTarget>(deploymentTargetJson, JsonOptions);
            }
            catch (JsonException)
            {
                return null;
            }

            if (string.IsNullOrWhiteSpace(legacy?.Id))
            {
                return null;
            }

            var name = string.IsNullOrWhiteSpace(siteName) ? legacy.Name : $"{siteName} ({legacy.Name ?? legacy.Id})";

            return new DeploymentTargetDataModel
            {
                Name = Truncate(name ?? legacy.Id, 200),
                DeployerDefinition = legacy.Id,
                Config = MapFieldNames(legacy.Id, legacy.Fields)
            };
        }

        /// <summary>
        /// v13 deployer field names, keyed by deployer id, mapped to the 14+ names. The deployer ids themselves didn't change.
        /// v13 "netlify" maps to the current Netlify deployer, not "netlify-legacy".
        /// Kept as strings because XStatic.Core can't reference the deployer projects; tests check these against the real definitions.
        /// </summary>
        public static readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> FieldNameMap =
            new Dictionary<string, IReadOnlyDictionary<string, string>>(StringComparer.OrdinalIgnoreCase)
            {
                ["netlify"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["PersonalAccessToken"] = "Netlify.PAT",
                    ["SiteId"] = "Netlify.SiteId",
                },
                ["git"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["RemoteUrl"] = "Git.RemoteUrl",
                    ["Email"] = "Git.Email",
                    ["Username"] = "Git.Uname",
                    ["Password"] = "Git.Pss",
                    ["Branch"] = "Git.Branch",
                },
                ["ftp"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["Hostname"] = "FTP.Hostname",
                    ["Username"] = "FTP.Uname",
                    ["Password"] = "FTP.Pss",
                    ["Folder"] = "FTP.Folder",
                    ["Port"] = "FTP.Port",
                },
                ["filesystem"] = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["FolderPath"] = "File.FolderPath",
                },
            };

        /// <summary>
        /// Renames v13 field names for the built-in deployers. Fields of custom deployers, and fields that are
        /// already in the new format, are copied unchanged.
        /// </summary>
        public static Dictionary<string, string> MapFieldNames(string deployerId, IDictionary<string, string> fields)
        {
            var result = new Dictionary<string, string>();
            if (fields == null)
            {
                return result;
            }

            FieldNameMap.TryGetValue(deployerId ?? string.Empty, out var map);

            foreach (var field in fields)
            {
                var key = map != null && map.TryGetValue(field.Key, out var newKey) ? newKey : field.Key;
                result[key] = field.Value;
            }

            return result;
        }

        private static Guid? ResolveKey(string value, IReadOnlyDictionary<int, Guid> nodeKeys)
        {
            if (TryParseInt(value, out var id))
            {
                return nodeKeys.TryGetValue(id, out var key) ? key : null;
            }

            // Tolerate values that are already keys.
            return Guid.TryParse(value?.Trim(), out var guid) ? guid : null;
        }

        private static List<int> ParseIntList(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new List<int>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<int>>(json, JsonOptions) ?? new List<int>();
            }
            catch (JsonException)
            {
                return SplitList(json.Trim('[', ']'))
                    .Select(x => TryParseInt(x, out var i) ? (int?)i : null)
                    .Where(x => x.HasValue)
                    .Select(x => x.Value)
                    .ToList();
            }
        }

        private static IEnumerable<string> SplitList(string value) =>
            string.IsNullOrWhiteSpace(value)
                ? Enumerable.Empty<string>()
                : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        private static bool TryParseInt(string value, out int result) => int.TryParse(value?.Trim(), out result);

        private static string Truncate(string value, int length) => value.Length <= length ? value : value[..length];

        private class LegacyDeploymentTarget
        {
            public string Id { get; set; }

            public string Name { get; set; }

            public Dictionary<string, string> Fields { get; set; }
        }
    }
}
