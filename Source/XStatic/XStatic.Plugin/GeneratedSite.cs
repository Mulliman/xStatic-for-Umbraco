using NPoco;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using UIOMatic.Attributes;
using Umbraco.Core.Persistence.DatabaseAnnotations;

namespace XStatic.Plugin
{
    [TableName("XStaticSiteConfigs")]
    [PrimaryKey("Id", AutoIncrement = true)]
    [UIOMatic("generatedSite", "Generated Sites", "Generated Sites", FolderIcon = "icon-sitemap", ItemIcon = "icon-umb-deploy", ParentAlias = "xstatic")]
    public class GeneratedSite
    {
        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        [Required]
        [Length(100)]
        [UIOMaticField(Name = "Name", Description = "Enter a name to easily manage multiple sites.")]
        public string Name { get; set; }

        [UIOMaticField(Name = "Auto Publish", Description = "Select this is you want to generate the site automatically when a node is published.")]
        public bool AutoPublish { get; set; }

        [Required]
        [Length(10)]
        [UIOMaticField(Name = "Root Node",
            Description = "Select the root of the site you want to create a static version of.",
            View = UIOMatic.Constants.FieldEditors.PickerContent)]
        public string RootNode { get; set; }

        [NullSetting(NullSetting = NullSettings.Null)]
        [Length(1000)]
        [UIOMaticField(Name = "Root Media Nodes",
           Description = "Select the media folders you want to include in your static site.",
           View = @"~\App_Plugins\xStatic\fields\multipicker.html",
            Config = @"{
        'multiPicker': true,
        'maxNumber': 100,
        'minNumber': 0,
        'startNode': {
            'type': 'media'
        }}")]
        public string MediaRootNodes { get; set; }

        [Required]
        [Length(100)]
        [UIOMaticField(Name = "Export Format",
           Description = "Do you want to export this site as a JSON API or as a static HTML website.",
           View = @"~\App_Plugins\xStatic\fields\ExportTypeField.html")]
        public string ExportFormat { get; set; }

        [NullSetting(NullSetting = NullSettings.Null)]
        [UIOMaticField(Name = "Last Run",
            View = UIOMatic.Constants.FieldEditors.DateTime)]
        public DateTime? LastRun { get; set; }

        [NullSetting(NullSetting = NullSettings.Null)]
        public int? LastBuildDurationInSeconds { get; set; }

        [NullSetting(NullSetting = NullSettings.Null)]
        [UIOMaticField(Name = "Last Deployed",
           View = UIOMatic.Constants.FieldEditors.DateTime)]
        public DateTime? LastDeployed { get; set; }

        [NullSetting(NullSetting = NullSettings.Null)]
        public int? LastDeployDurationInSeconds { get; set; }

        [NullSetting(NullSetting = NullSettings.Null)]
        [UIOMaticField(Name = "Asset Paths",
            Description = "Add folder names of files on disk that should also be packaged up. Comma separate e.g. assets/js,assets/css",
            View = UIOMatic.Constants.FieldEditors.Textfield)]
        public string AssetPaths { get; set; }

        [SerializedColumn]
        [NullSetting(NullSetting = NullSettings.Null)]
        [UIOMaticField(Name = "Deployment Target",
           Description = "Configure your deployment target by filling in all required settings.",
           View = @"~\App_Plugins\xStatic\fields\DeploymentTargetField.html")]
        public DeploymentTargetModel DeploymentTarget { get; set; }

        public override string ToString()
        {
            return Name;
        }
    }

    public class DeploymentTargetModel
    {
        public string id { get; set; }

        public string name { get; set; }

        public Dictionary<string, string> fields { get; set; }
    }
}