using System;

namespace XStatic.Core.Models
{
    public class TypeModel
    {
        public TypeModel()
        {
        }

        public TypeModel(Type type)
        {
            Id = type.AssemblyQualifiedName;
            Name = type.Name;
        }

        public string Id { get; set; }

        public string Name { get; set; }
    }
}
