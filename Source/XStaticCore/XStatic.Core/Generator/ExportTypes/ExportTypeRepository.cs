using NPoco;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Infrastructure.Scoping;
using XStatic.Core.Generator.Db;

namespace XStatic.Core.Generator.ExportTypes
{
    public class ExportTypeRepository : IExportTypeRepository
    {
        private readonly IScopeProvider _scopeProvider;

        public ExportTypeRepository(IScopeProvider scopeProvider)
        {
            _scopeProvider = scopeProvider;
        }

        public IEnumerable<ExportTypeDataModel> GetAll()
        {
            using IScope scope = _scopeProvider.CreateScope();

            var query = new Sql().Select("*").From(ExportTypeDataModel.TableName);

            var sites = scope.Database.Fetch<ExportTypeDataModel>(query);

            scope.Complete();

            return sites;
        }

        public virtual ExportTypeDataModel Get(int dbId)
        {
            using IScope scope = _scopeProvider.CreateScope();

            var query = new Sql().Select("*").From(ExportTypeDataModel.TableName).Where("Id = " + dbId);

            var sites = scope.Database.Fetch<ExportTypeDataModel>(query);

            scope.Complete();

            return sites.FirstOrDefault();
        }

        public virtual ExportTypeDataModel Create(ExportTypeDataModel data)
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

        public virtual ExportTypeDataModel Update(ExportTypeDataModel update)
        {
            using IScope scope = _scopeProvider.CreateScope();
            var entity = Get(update.Id);

            try
            {
                entity.Name = update.Name;
                entity.Generator = update.Generator;
                entity.TransformerFactory = update.TransformerFactory;
                entity.FileNameGenerator = update.FileNameGenerator;

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
                scope.Database.Delete<ExportTypeDataModel>(id);
            }
            catch
            {
                throw new XStaticException("Unable to delete Export Type from database.");
            }

            scope.Complete();
        }
    }
}