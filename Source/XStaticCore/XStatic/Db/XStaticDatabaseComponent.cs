using System;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.Scoping;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Infrastructure.Migrations;
using Microsoft.Extensions.Logging;
using Umbraco.Cms.Infrastructure.Migrations.Upgrade;
using XStatic.Plugin.Db;

namespace XStatic.Db
{
    public class XStaticDatabaseComponent : IComponent
    {
        private readonly IScopeProvider scopeProvider;
        private readonly IMigrationBuilder migrationBuilder;
        private readonly IKeyValueService keyValueService;
        private readonly ILogger<Upgrader> logger;
        private readonly ILoggerFactory loggerFactory;

        public XStaticDatabaseComponent(
            IScopeProvider scopeProvider,
            IMigrationBuilder migrationBuilder,
            IKeyValueService keyValueService,
            ILogger<Upgrader> logger,
            ILoggerFactory loggerFactory)
        {
            this.scopeProvider = scopeProvider;
            this.migrationBuilder = migrationBuilder;
            this.keyValueService = keyValueService;
            this.logger = logger;
            this.loggerFactory = loggerFactory;
        }

        public void Initialize()
        {
            var upgrader = new Upgrader(new XStaticDatabaseMigrationPlan());
            upgrader.Execute(scopeProvider, migrationBuilder, keyValueService, logger, loggerFactory);
        }

        public void Terminate()
        {
            throw new NotImplementedException();
        }
    }
}