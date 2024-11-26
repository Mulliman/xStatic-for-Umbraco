namespace XStatic.RemoteOperations
{
    public class BuildDeployResult
    {
        public RebuildProcessResult? RebuildProcessResult { get; set; }

        public XStaticResult? DeployProcessResult { get; set; }

        public System.Exception? Exception { get; set; }
    }
}
