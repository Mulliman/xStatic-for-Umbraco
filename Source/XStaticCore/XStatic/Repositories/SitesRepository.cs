using NPoco;
using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Generator;
using XStatic.Generator.Storage;
using XStatic.Models;
using XStatic.Plugin;
using XStatic.Plugin.Controllers;

namespace XStatic.Repositories
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

        public virtual SiteConfig Get(int staticSiteId)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<SiteConfig>(query).FirstOrDefault();

            return entity;
        }

        public virtual SiteConfig Create(SiteUpdateModel update)
        {
            var entity = new SiteConfig();

            entity.Name = update.Name;
            entity.AssetPaths = update.AssetPaths;
            entity.AutoPublish = update.AutoPublish;
            entity.DeploymentTarget = update.DeploymentTarget;
            entity.ExportFormat = update.ExportFormat;
            entity.ImageCrops = update.ImageCrops;
            entity.MediaRootNodes = update.MediaRootNodes;
            entity.RootNode = update.RootNode;
            entity.TargetHostname = update.TargetHostname;

            var db = GetDb();

            db.Insert<SiteConfig>(entity);

            return entity;
        }

        public virtual SiteConfig Update(SiteUpdateModel update)
        {
            var entity = Get(update.Id);

            entity.Name = update.Name;
            entity.AssetPaths = update.AssetPaths;
            entity.AutoPublish = update.AutoPublish;
            entity.DeploymentTarget = update.DeploymentTarget;
            entity.ExportFormat = update.ExportFormat;
            entity.ImageCrops = update.ImageCrops;
            entity.MediaRootNodes = update.MediaRootNodes;
            entity.RootNode = update.RootNode;
            entity.TargetHostname = update.TargetHostname;

            var db = GetDb();

            db.Save<SiteConfig>(entity);

            return entity;
        }

        public virtual SiteConfig UpdateLastRun(int staticSiteId, int? secondsTaken = null)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<SiteConfig>(query).FirstOrDefault();

            entity.LastRun = DateTime.Now;

            if(secondsTaken != null)
            {
                entity.LastBuildDurationInSeconds = secondsTaken;
            }

            db.Save<SiteConfig>(entity);

            return entity;
        }

        public virtual SiteConfig UpdateLastDeploy(int staticSiteId, int? secondsTaken = null)
        {
            var db = GetDb();

            var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

            var entity = db.Fetch<SiteConfig>(query).FirstOrDefault();

            entity.LastDeployed = DateTime.Now;

            if (secondsTaken != null)
            {
                entity.LastDeployDurationInSeconds = secondsTaken;
            }

            db.Save<SiteConfig>(entity);

            return entity;
        }

        public virtual Database GetDb()
        {
            return new Database(Umbraco.Cms.Core.Constants.System.UmbracoConnectionName, DatabaseType.SQLCe, System.Data.SqlClient.SqlClientFactory.Instance);
        }
    }
}