using System.Threading.Tasks;
using XStatic.Core.Models;

namespace XStatic.Core.Deploy.Targets.Creators
{
    public interface IDeploymentTargetCreator
    {
        Task<DeploymentTargetUpdateModel> CreateTarget();
    }
}
