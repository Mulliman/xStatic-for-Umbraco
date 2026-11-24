using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Helpers;

namespace XStatic.Core.Actions
{
    public class PostGenerationActionsList
    {
        public List<Type> PostActions { get; }

        public PostGenerationActionsList()
        {
            PostActions = LoadableTypes.ImplementationsOf<IPostGenerationAction>();
        }
    }
}