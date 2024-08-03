using System.Collections.Generic;

namespace XStatic.Core.Deploy
{
    public interface IDeployerDefinition
    {
        string Id { get; }

        string Name { get; }

        string Help { get; }

        IEnumerable<DeployerField> Fields { get; }
    }

    public class DeployerField
    {
        public string Name { get; set; }

        public string Value { get; set; }

        public string Help { get; set; }

        public string EditorUiAlias { get; set; } = "Umb.PropertyEditorUi.TextBox";
    }
}