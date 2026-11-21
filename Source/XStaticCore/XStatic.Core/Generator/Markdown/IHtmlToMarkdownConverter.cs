using System.Collections.Generic;

namespace XStatic.Core.Generator.Markdown
{
    public class HtmlPageMetadata
    {
        public string Title { get; set; }

        public string Description { get; set; }

        public string CanonicalUrl { get; set; }

        public string OgUrl { get; set; }

        public List<string> JsonLdBlocks { get; set; } = new List<string>();
    }

    public class HtmlToMarkdownOptions
    {
        /// <summary>
        /// Optional comma-separated list of tag names or simple selectors (e.g. "main, article")
        /// used to locate the primary content root before falling back to &lt;body&gt;.
        /// </summary>
        public string ContentSelector { get; set; }

        /// <summary>
        /// When true (default), removes layout chrome such as nav, header, footer, aside, script, style, etc.
        /// </summary>
        public bool StripNavigationChrome { get; set; } = true;

        /// <summary>
        /// When true (default), prepends "# {Title}" if the converted Markdown does not already begin with an H1 heading.
        /// </summary>
        public bool EnsureTitleHeading { get; set; } = true;
    }

    public interface IHtmlToMarkdownConverter
    {
        string Convert(string html, HtmlToMarkdownOptions options = null);

        HtmlPageMetadata ExtractMetadata(string html);
    }
}
