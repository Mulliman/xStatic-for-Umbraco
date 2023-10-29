using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Generator.Db;
using XStatic.Core.Generator.ExportTypes;

namespace XStatic.Core.Generator.Headless
{
    public class TestHeadlessApiRequestRepository : IHeadlessApiRequestRespository
    {
        public HeadlessApiRequestDataModel Create(HeadlessApiRequestDataModel data)
        {
            throw new NotImplementedException();
        }

        public void Delete(int id)
        {
            throw new NotImplementedException();
        }

        public HeadlessApiRequestDataModel Get(int dbId)
        {
            return GetAll().First();
        }

        public IEnumerable<HeadlessApiRequestDataModel> GetAll()
        {
            var test = new HeadlessApiRequestDataModel
            {
                Id = 1,
                Name = "test",
                RequestUrlFormat = "/umbraco/delivery/api/v1/content",
                SpecificCulture = "en-US",
                SpecificStartItem = null,
                StorageUrlFormat = "/api/content",
                UsePreview = true
            };

            return new List<HeadlessApiRequestDataModel> { test };
        }

        public HeadlessApiRequestDataModel Update(HeadlessApiRequestDataModel update)
        {
            throw new NotImplementedException();
        }
    }
}
