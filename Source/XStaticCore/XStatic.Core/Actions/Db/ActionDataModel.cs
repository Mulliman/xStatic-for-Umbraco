using NPoco;
using Umbraco.Cms.Infrastructure.Persistence.DatabaseAnnotations;

namespace XStatic.Core.Actions.Db
{
    [TableName(TableName)]
    [PrimaryKey("Id", AutoIncrement = true)]
    public class ActionDataModel
    {
        public const string TableName = "XStaticActions";

        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        public string Name { get; set; }

        public string Category { get; set; }

        public string Type { get; set; }

        public string Config { get; set; }
    }
}