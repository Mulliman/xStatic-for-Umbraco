using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Library;

namespace XStatic.Deploy
{
    public interface IDeployer
    {
        Task<XStaticResult> DeployWholeSite(string folderPath);
    }
}