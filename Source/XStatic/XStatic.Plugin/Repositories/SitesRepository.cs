using NPoco;
using System;
using System.Collections.Generic;

namespace XStatic.Plugin.Repositories
{
    public class SitesRepository
    {
        const string SitesTableName = "xStaticGeneratedSite";

        public virtual IEnumerable<GeneratedSite> GetAll()
        {
            var db = GetDb();


            var q = "select table_name from information_schema.tables where TABLE_TYPE <> 'VIEW'";

            var tables = db.Fetch<string>(q);

            var query = new Sql().Select("*").From(SitesTableName);

            return db.Fetch<GeneratedSite>(query);
        }

        public virtual Database GetDb()
        {
            return new Database(Umbraco.Core.Constants.System.UmbracoConnectionName);
        }
    }
}