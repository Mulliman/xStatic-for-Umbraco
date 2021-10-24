using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Actions;
using XStatic.Core.Generator.Storage;

namespace XStatic.Netlify.Actions
{
    [XStaticEditableField("FilePath")]
    public class Netlify404Action : FileRenameAction
    {
        const string Netlify404FilePath = "/404.html";

        public Netlify404Action(IStaticSiteStorer staticSiteStorer) : base(staticSiteStorer)
        {
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var existingFilePath = parameters["FilePath"];

            return await MoveFile(staticSiteId, existingFilePath, Netlify404FilePath);
        }
    }
}