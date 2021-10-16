//using System.Web.Http;
//using System.Web.UI;
//using Umbraco.Core.Composing;
//using Umbraco.Web.Editors;
//using Umbraco.Web.Mvc;
//using XStatic.Generator.Storage;
//using XStatic.Library;
//using XStatic.Plugin.Repositories;

namespace XStatic.Plugin
{
    public class ExtendedGeneratedSite : SiteConfig
    {
        public string RootPath { get; set; }

        public string FolderSize { get; set; }

        public string ExportTypeName { get; set; }

        public string LastRunString => LastDeployed?.ToString("hh:mm dd MMM yy");

        public string LastDeployedString => LastDeployed?.ToString("hh:mm dd MMM yy");
    }
}
