using NPoco;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Infrastructure.Scoping;
using XStatic.Core.Generator.Db;

namespace XStatic.Core.Generator.Headless
{
    public class HeadlessApiRequestRespository : IHeadlessApiRequestRespository
    {
        private readonly IScopeProvider _scopeProvider;

        public HeadlessApiRequestRespository(IScopeProvider scopeProvider)
        {
            _scopeProvider = scopeProvider;
        }

        public IEnumerable<HeadlessApiRequestDataModel> GetAll()
        {
            using IScope scope = _scopeProvider.CreateScope();

            var query = new Sql().Select("*").From(HeadlessApiRequestDataModel.TableName);

            var sites = scope.Database.Fetch<HeadlessApiRequestDataModel>(query);

            scope.Complete();

            return sites;
        }

        public virtual HeadlessApiRequestDataModel Get(int dbId)
        {
            using IScope scope = _scopeProvider.CreateScope();

            var query = new Sql().Select("*").From(HeadlessApiRequestDataModel.TableName).Where("Id = " + dbId);

            var sites = scope.Database.Fetch<HeadlessApiRequestDataModel>(query);

            scope.Complete();

            return sites.FirstOrDefault();
        }

        public virtual HeadlessApiRequestDataModel Create(HeadlessApiRequestDataModel data)
        {
            using IScope scope = _scopeProvider.CreateScope();

            try
            {
                scope.Database.Insert(data);
            }
            catch
            {
                throw new XStaticException("Unable to insert Export Type into the database.");
            }

            scope.Complete();

            return data;
        }

        public virtual HeadlessApiRequestDataModel Update(HeadlessApiRequestDataModel update)
        {
            using IScope scope = _scopeProvider.CreateScope();
            var entity = Get(update.Id);

            try
            {
                entity.Name = update.Name;
               
                // todo

                scope.Database.Save(entity);
            }
            catch
            {
                throw new XStaticException("Unable to insert Export Type into the database.");
            }

            var updatedEntity = Get(update.Id);

            scope.Complete();

            return updatedEntity;
        }

        public virtual void Delete(int id)
        {
            using IScope scope = _scopeProvider.CreateScope();

            try
            {
                scope.Database.Delete<HeadlessApiRequestDataModel>(id);
            }
            catch
            {
                throw new XStaticException("Unable to delete Export Type from database.");
            }

            scope.Complete();
        }
    }
}