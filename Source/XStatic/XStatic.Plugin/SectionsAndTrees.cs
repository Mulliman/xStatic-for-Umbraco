using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Formatting;
using System.Text;
using System.Threading.Tasks;
using UIOMatic.Web.Controllers;
using Umbraco.Core.Composing;
using Umbraco.Core.Models.Sections;
using Umbraco.Web;
using Umbraco.Web.Models.Trees;
using Umbraco.Web.Mvc;
using Umbraco.Web.Trees;
using Umbraco.Web.WebApi.Filters;

namespace XStatic.Plugin
{
    public class SectionsAndTrees
    {
    }

	[ComposeAfter(typeof(UIOMatic.Sections.SectionComposer))]
	public class SectionComposer : IUserComposer
	{
		public void Compose(Composition composition)
		{
			composition.Sections().Append<GeneratedSitesSection>();
			composition.Sections().Remove<UIOMatic.Sections.UIOMaticSection>();
		}

		public class GeneratedSitesSection : ISection
		{
			public string Alias => GeneratedSitesController.Alias;
			public string Name => GeneratedSitesController.Name;
		}
	}

	public abstract class UIOMaticSubSectionTreeController : UIOMaticTreeController
	{
		private const string UIOMaticRoutePath = UIOMatic.Constants.SectionAlias + "/" + UIOMatic.Constants.TreeAlias + "/";

		public abstract string SubSectionAlias { get; }
		public abstract string SubSectionName { get; }
		protected string BaseRoutePath => $"{SubSectionAlias}/{UIOMatic.Constants.TreeAlias}/";

		protected override TreeNodeCollection GetTreeNodes(string id, FormDataCollection queryStrings) => UpdateRoutePath(base.GetTreeNodes(GetNodeId(id, queryStrings), queryStrings));

		protected override MenuItemCollection GetMenuForNode(string id, FormDataCollection queryStrings) => base.GetMenuForNode(GetNodeId(id, queryStrings), queryStrings);

		protected override TreeNode CreateRootNode(FormDataCollection queryStrings) => UpdateRoutePath(base.CreateRootNode(queryStrings));

		protected virtual string GetNodeId(string id, FormDataCollection queryStrings) =>
			!string.IsNullOrWhiteSpace(queryStrings.Get("startNodeId"))
			? queryStrings.Get("startNodeId")
			: (string.IsNullOrEmpty(id) || id == global::Umbraco.Core.Constants.System.RootString ? SubSectionAlias : id);

		protected virtual TreeNodeCollection UpdateRoutePath(TreeNodeCollection nodes)
		{
			if (nodes == null || nodes.Count == 0) return nodes;

			foreach (var node in nodes) UpdateRoutePath(node);

			return nodes;
		}

		protected virtual TreeNode UpdateRoutePath(TreeNode node)
		{
			if (node?.RoutePath != null && node.RoutePath.StartsWith(UIOMaticRoutePath)) node.RoutePath = BaseRoutePath + (node.RoutePath.Length > UIOMaticRoutePath.Length ? node.RoutePath.Substring(UIOMaticRoutePath.Length) : "");
			else if (node?.RoutePath == UIOMatic.Constants.SectionAlias) node.RoutePath = SubSectionAlias;
			if (node?.Name == "UI-O-Matic") node.Name = SubSectionName;
			return node;
		}
	}

	[UmbracoApplicationAuthorize(Alias)]
	[UmbracoTreeAuthorize("content")]
	[Tree(Alias, "uiomatic", TreeTitle = Name, SortOrder = 1)]
	[PluginController("UIOMatic")]
	public class GeneratedSitesController : UIOMaticSubSectionTreeController
	{
		public const string Alias = "xstatic";
		public const string Name = "Generated Sites";

		public override string SubSectionAlias => Alias;
		public override string SubSectionName => Name;
	}
}
