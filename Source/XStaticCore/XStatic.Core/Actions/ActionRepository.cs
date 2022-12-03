using NPoco;
using System;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Infrastructure.Scoping;
using XStatic.Core.Actions.Db;

namespace XStatic.Core.Actions
{
    public class ActionRepository : IActionRepository
    {
        private readonly IScopeProvider _scopeProvider;

        public ActionRepository(IScopeProvider scopeProvider)
        {
            _scopeProvider = scopeProvider;
        }

        public IEnumerable<ActionDataModel> GetAll()
        {
            using (var scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(ActionDataModel.TableName);

                var sites = scope.Database.Fetch<ActionDataModel>(query);

                scope.Complete();

                return sites;
            }
        }

        public IEnumerable<ActionDataModel> GetAllInCategory(string category)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(ActionDataModel.TableName).Where("Category = @0", category);

                var sites = scope.Database.Fetch<ActionDataModel>(query);

                scope.Complete();

                return sites;
            }
        }

        public virtual ActionDataModel Get(int dbId)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(ActionDataModel.TableName).Where("Id = " + dbId);

                var sites = scope.Database.Fetch<ActionDataModel>(query);

                scope.Complete();

                return sites.FirstOrDefault();
            }
        }

        public virtual ActionDataModel Create(ActionDataModel data)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                try
                {
                    scope.Database.Insert(data);
                }
                catch
                {
                    throw new XStaticException("Unable to insert Action into the database.");
                }

                scope.Complete();

                return data;
            }
        }

        public virtual ActionDataModel Update(ActionDataModel update)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var entity = Get(update.Id);

                try
                {
                    entity.Name = update.Name;
                    entity.Category = update.Category;
                    entity.Config = update.Config;
                    entity.Type = update.Type;

                    scope.Database.Save(entity);
                }
                catch
                {
                    throw new XStaticException("Unable to insert Action into the database.");
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
                    scope.Database.Delete<ActionDataModel>(id);
                }
                catch
                {
                    throw new XStaticException("Unable to delete Action from database.");
                }

                scope.Complete();
            }
        }
    }
}