using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator
{
    public class GeneratorList
    {
        public List<Type> Generators { get; }

        public GeneratorList()
        {
            Generators = LoadableTypes.ImplementationsOf<IGenerator>();
        }
    }
}