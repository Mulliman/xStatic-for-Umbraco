using NPoco;
using System;
using System.Collections.Generic;
using System.Linq;
using Umbraco.Cms.Core.Scoping;
using XStatic.Core.Generator.Db;
using XStatic.Core.Models;
using XStatic.Plugin;

namespace XStatic.Core.Repositories
{
    public class SitesRepository : ISitesRepository
    {
        const string SitesTableName = SiteConfig.TableName;
        private readonly IScopeProvider _scopeProvider;

        public SitesRepository(IScopeProvider scopeProvider)
        {
            _scopeProvider = scopeProvider;
        }

        public virtual IEnumerable<ExtendedGeneratedSite> GetAll()
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(SitesTableName);

                var sites = scope.Database.Fetch<ExtendedGeneratedSite>(query);

                scope.Complete();

                return sites;
            }
        }

        public virtual IEnumerable<ExtendedGeneratedSite> GetAutoPublishSites()
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(SitesTableName);

                var sites = scope.Database.Fetch<ExtendedGeneratedSite>(query);

                scope.Complete();

                return sites.Where(s => s.AutoPublish);
            }
        }

        public virtual T Get<T>(int staticSiteId) where T : SiteConfig
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

                var sites = scope.Database.Fetch<T>(query);

                scope.Complete();

                return sites.FirstOrDefault();
            }
        }

        public virtual SiteConfig Create(SiteUpdateModel update)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var entity = new SiteConfig();

                try
                {
                    entity.Name = update.Name;
                    entity.AssetPaths = update.AssetPaths;
                    entity.AutoPublish = update.AutoPublish;
                    entity.DeploymentTarget = update.DeploymentTarget;
                    entity.ExportFormat = update.ExportFormat;
                    entity.ImageCrops = update.ImageCrops;
                    entity.MediaRootNodes = update.MediaRootNodes;
                    entity.RootNode = update.RootNode;
                    entity.TargetHostname = update.TargetHostname;

                    scope.Database.Insert(entity);
                }
                catch (Exception ex)
                {
                    throw new XStaticException("Unable to insert into the database.");
                }

                scope.Complete();

                return entity;
            }
        }

        public virtual ExtendedGeneratedSite Update(SiteUpdateModel update)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                var entity = Get<SiteConfig>(update.Id);

                try
                {
                    entity.Name = update.Name;
                    entity.AssetPaths = update.AssetPaths;
                    entity.AutoPublish = update.AutoPublish;
                    entity.DeploymentTarget = update.DeploymentTarget;
                    entity.ExportFormat = update.ExportFormat;
                    entity.ImageCrops = update.ImageCrops;
                    entity.MediaRootNodes = update.MediaRootNodes;
                    entity.RootNode = update.RootNode;
                    entity.TargetHostname = update.TargetHostname;

                    scope.Database.Save(entity);
                }
                catch (Exception ex)
                {
                    throw new XStaticException("Unable to insert into the database.");
                }

                var updatedEntity = Get<ExtendedGeneratedSite>(update.Id);

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
                    scope.Database.Delete<SiteConfig>(id);
                }
                catch (Exception ex)
                {
                    throw new XStaticException("Unable to delete from database.");
                }

                scope.Complete();
            }
        }

        public virtual SiteConfig UpdateLastRun(int staticSiteId, int? secondsTaken = null)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                try
                {
                    var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

                    var entity = scope.Database.Fetch<SiteConfig>(query).FirstOrDefault();

                    entity.LastRun = DateTime.Now;

                    if (secondsTaken != null)
                    {
                        entity.LastBuildDurationInSeconds = secondsTaken;
                    }

                    scope.Database.Save(entity);

                    scope.Complete();

                    return entity;
                }
                catch (Exception ex)
                {
                    scope.Complete();
                    throw new XStaticException("Unable to insert into the database.");
                }
            }
        }

        public virtual SiteConfig UpdateLastDeploy(int staticSiteId, int? secondsTaken = null)
        {
            using (IScope scope = _scopeProvider.CreateScope())
            {
                try
                {
                    var query = new Sql().Select("*").From(SitesTableName).Where("Id = " + staticSiteId);

                    var entity = scope.Database.Fetch<SiteConfig>(query).FirstOrDefault();

                    entity.LastDeployed = DateTime.Now;

                    if (secondsTaken != null)
                    {
                        entity.LastDeployDurationInSeconds = secondsTaken;
                    }

                    scope.Database.Save(entity);

                    scope.Complete();

                    return entity;
                }
                catch (Exception ex)
                {
                    scope.Complete();
                    throw new XStaticException("Unable to insert into the database.");
                }
            }
        }
    }
}