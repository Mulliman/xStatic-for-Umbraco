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

        public virtual IEnumerable<ExtendedGeneratedSite> GetAutoPublishSites()
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName);

            var sites = db.Fetch<ExtendedGeneratedSite>(query);

            return sites.Where(s => s.AutoPublish);
        }

        public virtual GeneratedSite Get(int staticSiteId)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<GeneratedSite>(query).FirstOrDefault();

            return entity;
        }

        public virtual GeneratedSite UpdateLastRun(int staticSiteId, int? secondsTaken = null)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<GeneratedSite>(query).FirstOrDefault();

            entity.LastRun = DateTime.Now;

            if(secondsTaken != null)
            {
                entity.LastBuildDurationInSeconds = secondsTaken;
            }

            db.Save<GeneratedSite>(entity);

            return entity;
        }

        public virtual GeneratedSite UpdateLastDeploy(int staticSiteId, int? secondsTaken = null)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<GeneratedSite>(query).FirstOrDefault();

            entity.LastDeployed = DateTime.Now;

            if (secondsTaken != null)
            {
                entity.LastDeployDurationInSeconds = secondsTaken;
            }

            db.Save<GeneratedSite>(entity);

            return entity;
        }

        public virtual Database GetDb()
        {
            return new Database(Umbraco.Core.Constants.System.UmbracoConnectionName);
        }
    }
}