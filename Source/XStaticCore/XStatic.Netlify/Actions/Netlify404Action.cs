using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Storage;

namespace XStatic.Netlify.Actions
{
    [XStaticEditableField("FilePath", "File Path")]
    public class Netlify404Action : FileCopyAction
    {
        const string Netlify404FilePath = "/404.html";

        public override string Name => nameof(Netlify404Action);

        public Netlify404Action(IStaticSiteStorer staticSiteStorer) : base(staticSiteStorer)
        {
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var existingFilePath = GetParameter(parameters, "FilePath");

            return await CopyFile(staticSiteId, existingFilePath, Netlify404FilePath);
        }
    }
}