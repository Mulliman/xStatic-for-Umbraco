using System;

namespace XStatic.Core
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    public class XStaticEditableFieldAttribute : Attribute
    {
        public XStaticEditableFieldAttribute(string fieldAlias, string fieldName = null, string editorUiAlias = null)
        {
            FieldAlias = fieldAlias;
            FieldName = fieldName ?? fieldAlias;

            if(editorUiAlias != null)
            {
                EditorUiAlias = editorUiAlias;
            }
        }

        public string FieldAlias { get; }

        public string FieldName { get; }

        public string EditorUiAlias { get; set; } = "Umb.PropertyEditorUi.TextBox";
    }
}