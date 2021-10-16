using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Generator.Storage;

namespace XStatic.Core.Generator.Storage
{
    public class FileNameGeneratorList
    {
        public List<Type> FileNameGenerators { get; }

        public FileNameGeneratorList()
        {
            FileNameGenerators = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(x => x.GetTypes())
                .Where(x => typeof(IFileNameGenerator).IsAssignableFrom(x) && !x.IsInterface && !x.IsAbstract)
                .ToList();
        }
    }
}