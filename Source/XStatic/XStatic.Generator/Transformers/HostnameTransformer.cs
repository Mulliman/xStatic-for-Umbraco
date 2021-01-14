using Umbraco.Web;

namespace XStatic.Generator.Transformers
{
    public class HostnameTransformer : ITransformer
    {
        private readonly string _targetHostname;

        public HostnameTransformer(string targetHostname)
        {
            _targetHostname = targetHostname;
        }

        public string Transform(string input, UmbracoContext context)
        {
            var output = input;

            foreach(var domain in context.Domains.GetAll(false))
            {
                output = output.Replace(domain.Name, _targetHostname);
            }

            return output;
        }
    }
}