using System.Collections.Generic;
using XStatic.Core.Deploy.Targets.Db;

namespace XStatic.Core.Deploy.Targets
{
    public interface IDeploymentTargetRepository
    {
        DeploymentTargetDataModel Create(DeploymentTargetDataModel data);
        void Delete(int id);
        DeploymentTargetDataModel Get(int dbId);
        IEnumerable<DeploymentTargetDataModel> GetAll();
        DeploymentTargetDataModel Update(DeploymentTargetDataModel update);
    }
}