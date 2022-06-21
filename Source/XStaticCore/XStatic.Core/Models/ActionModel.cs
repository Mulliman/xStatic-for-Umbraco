using System;
using XStatic.Core.Actions.Db;

namespace XStatic.Core.Models
{
    public class ActionModel
    {
        public ActionModel()
        {
        }

        public ActionModel(ActionDataModel data)
        {
            Id = data.Id;
            Name = data.Name;

            try
            {
                if (!string.IsNullOrWhiteSpace(data.Type))
                {
                    var type = System.Type.GetType(data.Type);
                    Type = new ConfigurableTypeModel(type, data.Config);
                }
            }
            catch (Exception e)
            {
                var hi = "";
                // Types must've changed since db updated.
                // Swallow for now until a good enough solution.
            }
        }

        public int Id { get; set; }

        public string Name { get; set; }

        public ConfigurableTypeModel Type { get; set; }
    }
}