using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator.Transformers
{
    public class TransformerList
    {
        public List<Type> TransformerListFactories { get; }

        public TransformerList()
        {
            TransformerListFactories = LoadableTypes.ImplementationsOf<ITransformerListFactory>();
        }
    }
}