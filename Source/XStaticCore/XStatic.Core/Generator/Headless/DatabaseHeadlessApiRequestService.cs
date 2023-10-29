using System;
using System.Collections.Generic;
using XStatic.Core.Generator.ExportTypes;

namespace XStatic.Core.Generator.Headless
{
    public class DatabaseHeadlessApiRequestService : IHeadlessApiRequestService
    {
        private readonly IHeadlessApiRequestRespository _repo;
        private readonly IServiceProvider _currentServiceProvider;

        public DatabaseHeadlessApiRequestService(IHeadlessApiRequestRespository repo, IServiceProvider currentServiceProvider)
        {
            _repo = repo;
            _currentServiceProvider = currentServiceProvider;
        }

        public IEnumerable<IHeadlessApiRequest> GetApiRequests()
        {
            return _repo.GetAll();
        }
    }
}