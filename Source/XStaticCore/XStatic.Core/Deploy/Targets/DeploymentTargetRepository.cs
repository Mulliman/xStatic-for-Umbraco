using NPoco;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Infrastructure.Scoping;
using XStatic.Core.Deploy.Targets.Db;

namespace XStatic.Core.Deploy.Targets
{
    public class DeploymentTargetRepository : IDeploymentTargetRepository
    {
        private readonly IScopeProvider _scopeProvider;

        public DeploymentTargetRepository(IScopeProvider scopeProvider)
        {
            _scopeProvider = scopeProvider;
        }

        public IEnumerable<DeploymentTargetDataModel> GetAll()
        {
            using (var scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(DeploymentTargetDataModel.TableName);

                var sites = scope.Database.Fetch<DeploymentTargetDataModel>(query);

                scope.Complete();

                return sites;
            }
        }

        public virtual DeploymentTargetDataModel Get(int dbId)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(DeploymentTargetDataModel.TableName).Where("Id = " + dbId);

                var sites = scope.Database.Fetch<DeploymentTargetDataModel>(query);

                scope.Complete();

                return sites.FirstOrDefault();
            }
        }

        public virtual DeploymentTargetDataModel Create(DeploymentTargetDataModel data)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                try
                {
                    scope.Database.Insert(data);
                }
                catch
                {
                    throw new XStaticException("Unable to insert Deployment Target into the database.");
                }

                scope.Complete();

                return data;
            }
        }

        public virtual DeploymentTargetDataModel Update(DeploymentTargetDataModel update)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var entity = Get(update.Id);

                try
                {
                    entity.Config = update.Config;
                    entity.DeployerDefinition = update.DeployerDefinition;

                    scope.Database.Save(entity);
                }
                catch
                {
                    throw new XStaticException("Unable to insert Deployment Target into the database.");
                }

                var updatedEntity = Get(update.Id);

                scope.Complete();

                return updatedEntity;
            }
        }

        public virtual void Delete(int id)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                try
                {
                    scope.Database.Delete<DeploymentTargetDataModel>(id);
                }
                catch
                {
                    throw new XStaticException("Unable to delete Deployment Target from database.");
                }

                scope.Complete();
            }
        }
    }
}