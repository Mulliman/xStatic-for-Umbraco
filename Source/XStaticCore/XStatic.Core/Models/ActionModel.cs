using XStatic.Core.Actions.Db;

namespace XStatic.Core.Models
{

    public class SafeActionModel(ActionDataModel data)
    {
        public int Id { get; } = data.Id;

        public string Name { get; } = data.Name;
    }

    public class ActionModel : SafeActionModel
    {
        public ActionModel(ActionDataModel data) : base(data)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(data.Type))
                {
                    var type = System.Type.GetType(data.Type);
                    Type = new ConfigurableTypeModel(type, data.Config);
                }
            }
            catch
            {
                // Types must've changed since db updated.
                // Swallow for now until a good enough solution.
            }
        }

        public ConfigurableTypeModel Type { get; set; }
    }
}