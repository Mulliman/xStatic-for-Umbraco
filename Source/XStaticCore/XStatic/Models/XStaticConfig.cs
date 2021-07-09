using System.Collections.Generic;
using XStatic.Deploy;

namespace XStatic.Models
{
    public class XStaticConfig
    {
        public IEnumerable<IDeployerDefinition> Deployers { get; set; }
    }
}