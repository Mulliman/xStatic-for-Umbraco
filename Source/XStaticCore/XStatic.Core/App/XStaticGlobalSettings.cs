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
    }
}