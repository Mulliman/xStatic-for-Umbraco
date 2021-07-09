using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Common;

namespace XStatic.Deploy
{
    public interface IDeployer
    {
        Task<XStaticResult> DeployWholeSite(string folderPath);
    }
}