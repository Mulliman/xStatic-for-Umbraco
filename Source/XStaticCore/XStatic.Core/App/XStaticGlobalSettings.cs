namespace XStatic.Core.App
{
    public class XStaticGlobalSettings
    {
        public bool UseXStaticUserRoles { get; set; }

        public string RoleCreationUser { get; set; }

        public bool RoleCreationUseRootUser { get; set; }

        public bool TrustSslWhenGenerating { get; set; }
    }
}