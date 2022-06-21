using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Actions.Db;

namespace XStatic.Core.Actions
{
    public class ActionFactory : IActionFactory
    {
        private readonly IActionRepository _repo;
        private readonly IServiceProvider _currentServiceProvider;

        public ActionFactory(IActionRepository repo, IServiceProvider currentServiceProvider)
        {
            _repo = repo;
            _currentServiceProvider = currentServiceProvider;
        }

        public IEnumerable<IPostGenerationAction> CreatePostGenerationActions(params int[] actionIds)
        {
            if (actionIds?.Any() == true)
            {
                foreach (var id in actionIds)
                {
                    var createdAction = CreatePostGenerationAction(id);

                    if (createdAction != null)
                    {
                        yield return createdAction;
                    }
                }
            }
        }

        public IPostGenerationAction CreatePostGenerationAction(int actionId)
        {
            var data = _repo.Get(actionId);

            return CreatePostGenerationAction(data);
        }

        public IPostGenerationAction CreatePostGenerationAction(ActionDataModel data)
        {
            if (data?.Type == null)
            {
                return null;
            }

            var typeName = data.Type;
            var type = Type.GetType(typeName);

            if(type == null)
            {
                return null;
            }

            var iocInstance = _currentServiceProvider.GetService(type) as IPostGenerationAction;

            if (iocInstance != null)
            {
                return iocInstance;
            }

            var generator = Activator.CreateInstance(type) as IPostGenerationAction;
            return generator;
        }

        public IEnumerable<ConfiguredPostGenerationAction> CreateConfiguredPostGenerationActions(params int[] actionIds)
        {
            if (actionIds?.Any() == true)
            {
                foreach (var id in actionIds)
                {
                    var createdAction = CreateConfiguredPostGenerationAction(id);

                    if (createdAction != null)
                    {
                        yield return createdAction;
                    }
                }
            }
        }

        public ConfiguredPostGenerationAction CreateConfiguredPostGenerationAction(int actionId)
        {
            var data = _repo.Get(actionId);

            var action = CreatePostGenerationAction(data);

            if(action == null)
            {
                return null;
            }

            return new ConfiguredPostGenerationAction(action, data.Config);
        }
    }
}