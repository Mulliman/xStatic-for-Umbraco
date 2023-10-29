using System.Collections.Generic;
using XStatic.Core.Generator.Db;

namespace XStatic.Core.Generator.ExportTypes
{
    public interface IHeadlessApiRequestRespository
    {
        HeadlessApiRequestDataModel Create(HeadlessApiRequestDataModel data);

        void Delete(int id);

        IEnumerable<HeadlessApiRequestDataModel> GetAll();

        HeadlessApiRequestDataModel Get(int dbId);

        HeadlessApiRequestDataModel Update(HeadlessApiRequestDataModel update);
    }
}