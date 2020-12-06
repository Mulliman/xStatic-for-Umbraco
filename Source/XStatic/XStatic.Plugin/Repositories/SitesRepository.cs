using NPoco;
using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Plugin.Controllers;

namespace XStatic.Plugin.Repositories
{
    public class SitesRepository
    {
        const string SitesTableName = "XStaticSiteConfigs";

        public virtual IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName);

            return db.Fetch<ExtendedGeneratedSite>(query);
        }

        public virtual GeneratedSite Get(int staticSiteId)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<GeneratedSite>(query).FirstOrDefault();

            return entity;
        }

        public virtual GeneratedSite UpdateLastRun(int staticSiteId)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<GeneratedSite>(query).FirstOrDefault();

            entity.LastRun = DateTime.Now;

            db.Save<GeneratedSite>(entity);

            return entity;
        }

        public virtual Database GetDb()
        {
            return new Database(Umbraco.Core.Constants.System.UmbracoConnectionName);
        }
    }
}