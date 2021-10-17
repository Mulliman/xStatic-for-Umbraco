using System.Collections.Generic;
using XStatic.Core.Generator.Db;

namespace XStatic.Core.Generator.ExportTypes
{
    public interface IExportTypeRepository
    {
        ExportTypeDataModel Create(ExportTypeDataModel data);

        void Delete(int id);

        IEnumerable<ExportTypeDataModel> GetAll();

        ExportTypeDataModel Get(int dbId);

        ExportTypeDataModel Update(ExportTypeDataModel update);
    }
}