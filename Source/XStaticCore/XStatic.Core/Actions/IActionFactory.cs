using System.Collections.Generic;

namespace XStatic.Core.Actions
{
    public interface IActionFactory
    {
        IPostGenerationAction CreatePostGenerationAction(int actionId);

        IEnumerable<IPostGenerationAction> CreatePostGenerationActions(params int[] actionIds);

        ConfiguredPostGenerationAction CreateConfiguredPostGenerationAction(int actionId);

        IEnumerable<ConfiguredPostGenerationAction> CreateConfiguredPostGenerationActions(params int[] actionIds);
    }
}