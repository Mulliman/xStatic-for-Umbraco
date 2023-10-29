using NPoco;
using Umbraco.Cms.Infrastructure.Persistence.DatabaseAnnotations;
using XStatic.Core.Generator.Headless;

namespace XStatic.Core.Generator.Db
{
    [TableName(TableName)]
    [PrimaryKey("Id")]
    public class HeadlessApiRequestDataModel : IHeadlessApiRequest
    {
        public const string TableName = "XStaticHeadlessApiRequests";

        [PrimaryKeyColumn(AutoIncrement = true)]
        public int Id { get; set; }

        public string Name { get; set; }

        public string RequestUrlFormat { get; set; }

        public string StorageUrlFormat { get; set; }

        public string SpecificStartItem { get; set; }

        public string SpecificCulture { get; set; }

        public bool UsePreview { get; set; }
    }
}