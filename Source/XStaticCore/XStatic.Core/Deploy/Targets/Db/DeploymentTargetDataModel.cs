using NPoco;
using System;
using System.Collections.Generic;
using Umbraco.Cms.Infrastructure.Persistence.DatabaseAnnotations;

namespace XStatic.Core.Deploy.Targets.Db
{
    [TableName(TableName)]
    [PrimaryKey("Id", AutoIncrement = true)]
    public class DeploymentTargetDataModel : IDeploymentTarget
    {
        public const string TableName = "XStaticDeploymentTargets";

        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        public string Name { get; set; }

        public string DeployerDefinition { get; set; }

        [SerializedColumn]
        public Dictionary<string, string> Config { get; set; }
    }
}
