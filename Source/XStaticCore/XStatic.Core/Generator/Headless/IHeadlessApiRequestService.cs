using System.Collections.Generic;

namespace XStatic.Core.Generator.Headless
{
    public interface IHeadlessApiRequestService
    {
        IEnumerable<IHeadlessApiRequest> GetApiRequests();
    }
}