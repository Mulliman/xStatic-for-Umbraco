namespace XStatic.Core.App
{
	using System.Collections.Generic;

	public class XStaticGlobalSettings
    {
        public bool UseXStaticUserRoles { get; set; }

        public string RoleCreationUser { get; set; }

        public bool RoleCreationUseRootUser { get; set; }

        public bool TrustSslWhenGenerating { get; set; }

        public IList<string> ExcludeGeneratingDocTypes { get; set; } = new List<string>();
    }
}