using System.Collections.Generic;

namespace XStatic.Core.App
{
    public class XStaticGlobalSettings
    {
        public bool UseXStaticUserRoles { get; set; }

        public string RoleCreationUser { get; set; }

        public bool RoleCreationUseRootUser { get; set; }

        public bool TrustSslWhenGenerating { get; set; }

        public IList<string> ExcludeGeneratingDocTypes { get; set; } = new List<string>();

        /// <summary>
        /// Files and folders to keep when a site's stored output is cleared. A path is kept when it ends with one of
        /// these values. When empty, <see cref="Helpers.FileHelpers.DefaultNonDeletePaths"/> (".git" and "CNAME") are kept.
        /// Set in appsettings.json as <c>XStatic:DoNotDeletePaths</c>. Setting it replaces the defaults.
        /// </summary>
        public IList<string> DoNotDeletePaths { get; set; } = new List<string>();

        public const int DefaultAutoPublishMaxRelationDepth = 5;

        /// <summary>
        /// Enables walking Umbraco relations (<see cref="Umbraco.Cms.Core.Services.IRelationService"/>) during
        /// auto-publish so updates to shared Library nodes or reusable Elements outside a site's content tree
        /// trigger rebuilds for referencing sites. Opt-in (disabled by default on LTS).
        /// </summary>
        public bool EnableRelationBasedAutoPublish { get; set; } = false;

        /// <summary>
        /// Maximum upstream relation depth to traverse when locating referencing pages for a published item.
        /// </summary>
        public int AutoPublishMaxRelationDepth { get; set; } = DefaultAutoPublishMaxRelationDepth;

        /// <summary>
        /// Optional list of content type aliases (e.g. global site settings or shared Library element types)
        /// whose publication should trigger auto-publish across all auto-publish enabled sites.
        /// </summary>
        public IList<string> AutoPublishGlobalContentTypes { get; set; } = new List<string>();

        /// <summary>
        /// Which environment variables and configuration keys secret references (<c>${env:NAME}</c>,
        /// <c>${config:Key}</c>) in deployment targets and actions may read. Set in appsettings.json as
        /// <c>XStatic:Secrets</c>.
        /// </summary>
        public XStaticSecretSettings Secrets { get; set; } = new XStaticSecretSettings();
    }
}