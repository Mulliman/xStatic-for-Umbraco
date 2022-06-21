using System.Threading.Tasks;

namespace XStatic.Core.Deploy
{
    public interface IDeployer
    {
        Task<XStaticResult> DeployWholeSite(string folderPath);
    }
}