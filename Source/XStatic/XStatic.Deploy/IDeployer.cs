using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Deploy
{
    public interface IDeployer
    {
        Task<DeployResult> DeployWholeSite(string folderPath);
    }
}