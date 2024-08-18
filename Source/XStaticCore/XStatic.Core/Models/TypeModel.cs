using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Actions.FileActions;

namespace XStatic.Core.Models
{
    public class TypeModel
    {
        public TypeModel()
        {
        }

        public TypeModel(Type type)
        {
            Id = type?.AssemblyQualifiedName;
            Name = type?.Name;
        }

        public string Id { get; set; }

        public string Name { get; set; }
    }

    public class ConfigurableTypeModel : TypeModel
    {
        public ConfigurableTypeModel(Type type)
        {
            Id = type?.AssemblyQualifiedName;
            Name = type?.Name;

            var attrs = type?.GetCustomAttributes(typeof(XStaticEditableFieldAttribute), false)
                ?.Cast<XStaticEditableFieldAttribute>()
                ?.Select(a => new ConfigurableTypeField { Name = a.FieldName, Value = "", EditorUiAlias = a.EditorUiAlias });

            if(attrs?.Any() == true)
            {
                Fields = attrs.ToList();
            }
        }

        public ConfigurableTypeModel(Type type, Dictionary<string, string> config) : this(type)
        {
            if(config == null)
            {
                return;
            }

            foreach(var field in Fields)
            {
                if(config.ContainsKey(field.Name))
                {
                    field.Value = config[field.Name];
                }
            }
        }

        public List<ConfigurableTypeField> Fields { get; set; }
    }

    public class ConfigurableTypeField
    {
        public string Alias => Name;

        public string Name { get; set; }

        public string Value { get; set; }

        public string EditorUiAlias { get; set; } = "Umb.PropertyEditorUi.TextBox";
    }
}
