using NPoco;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UIOMatic.Attributes;
using Umbraco.Core.Persistence.DatabaseAnnotations;

namespace XStatic.Plugin
{
    [TableName("xStaticGeneratedSite")]
    [UIOMatic("generatedSite", "Generated Sites", "Generated Sites", FolderIcon = "icon-sitemap", ItemIcon = "icon-umb-deploy", ParentAlias = "xstatic")]
    public class GeneratedSite
    {
        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        [Required]
        [UIOMaticField(Name = "Name", Description = "Enter a name to easily manage multiple sites.")]
        public string Name { get; set; }

        [UIOMaticField(Name = "Auto Publish", Description = "Select this is you want to generate the site automatically when a node is published.")]
        public bool AutoPublish { get; set; }

        [UIOMaticField(Name = "Root Node",
            Description = "Select the root of the site you want to create a static version of.",
            View = UIOMatic.Constants.FieldEditors.PickerContent)]
        public string RootNode { get; set; }

        public override string ToString()
        {
            return Name;
        }
    }
}