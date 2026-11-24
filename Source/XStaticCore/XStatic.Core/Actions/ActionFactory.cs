using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core.Actions.Db;
using XStatic.Core.Secrets;

namespace XStatic.Core.Actions
{
    public class ActionFactory : IActionFactory
    {
        private readonly IActionRepository _repo;
        private readonly IServiceProvider _currentServiceProvider;

        private readonly ISecretReferenceResolver _secretResolver;

        public ActionFactory(IActionRepository repo, IServiceProvider currentServiceProvider)
            : this(repo, currentServiceProvider, null)
        {
        }

        /// <param name="secretResolver">
        /// Resolves <c>${env:...}</c> and <c>${config:...}</c> references in each configured action's settings.
        /// When <c>null</c>, settings are passed on exactly as stored.
        /// </param>
        public ActionFactory(IActionRepository repo, IServiceProvider currentServiceProvider, ISecretReferenceResolver secretResolver)
        {
            _repo = repo;
            _currentServiceProvider = currentServiceProvider;
            _secretResolver = secretResolver;
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

            var generator = ActivatorUtilities.CreateInstance(_currentServiceProvider, type) as IPostGenerationAction;
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

            // Report results under the name the editor gave the action ("Copy 404 page"), not the type name
            // ("FileCopyAction"), so several actions of the same type can be told apart.
            return new ConfiguredPostGenerationAction(action, data.Config, _secretResolver)
            {
                Name = string.IsNullOrWhiteSpace(data.Name) ? action.Name : data.Name
            };
        }
    }
}