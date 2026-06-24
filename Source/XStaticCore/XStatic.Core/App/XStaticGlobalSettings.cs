namespace XStatic.Core.App
{
    public class XStaticGlobalSettings
    {
        public bool UseXStaticUserRoles { get; set; }

        public string RoleCreationUser { get; set; }

        public bool RoleCreationUseRootUser { get; set; }

        public bool TrustSslWhenGenerating { get; set; }

        public AiSettings Ai { get; set; } = new AiSettings();
    }

    public class AiSettings
    {
        public bool Enabled { get; set; }
        public string Provider { get; set; }
        public string Model { get; set; }
        public bool AutoGenerateMetaDescriptions { get; set; }
    }
}
