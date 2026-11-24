using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Helpers;

namespace XStatic.Core.Generator.Storage
{
    public class FileNameGeneratorList
    {
        public List<Type> FileNameGenerators { get; }

        public FileNameGeneratorList()
        {
            FileNameGenerators = LoadableTypes.ImplementationsOf<IFileNameGenerator>();
        }
    }
}