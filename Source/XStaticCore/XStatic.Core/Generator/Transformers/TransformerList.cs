using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Generator.Transformers;

namespace XStatic.Core.Generator.Transformers
{
    public class TransformerList
    {
        public List<Type> TransformerListFactories { get; }

        public TransformerList()
        {
            TransformerListFactories = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(x => x.GetTypes())
                .Where(x => typeof(ITransformerListFactory).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
                .ToList();
        }
    }
}