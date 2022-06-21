using System.Collections.Generic;

namespace XStatic.Core.Models
{
    public class ActionUpdateModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Type { get; set; }

        public Dictionary<string, string> Config { get; set; }
    }
}