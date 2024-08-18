using System;

namespace XStatic.Core
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
    public class XStaticEditableFieldAttribute : Attribute
    {
        public XStaticEditableFieldAttribute(string fieldName, string editorUiAlias = null)
        {
            FieldName = fieldName;

            if(editorUiAlias != null)
            {
                EditorUiAlias = editorUiAlias;
            }
        }

        public string FieldAlias => FieldName;

        public string FieldName { get; }

        public string EditorUiAlias { get; set; } = "Umb.PropertyEditorUi.TextBox";
    }
}