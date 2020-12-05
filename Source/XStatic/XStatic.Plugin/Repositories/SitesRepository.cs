using NPoco;
using System;
using System.Collections.Generic;
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

        public virtual Database GetDb()
        {
            return new Database(Umbraco.Core.Constants.System.UmbracoConnectionName);
        }
    }
}