using System;

namespace XStatic.Core
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    public class XStaticEditableFieldAttribute : Attribute
    {
        public XStaticEditableFieldAttribute(string fieldName)
        {
            FieldName = fieldName;
        }

        public string FieldName { get; }
    }
}