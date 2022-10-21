namespace XStatic.Core.Generator
{
    public class GenerateItemResult
    {
        public bool WasSuccessful { get; set; }

        public string Type { get; set; }

        public string Item { get; set; }

        public string Message { get; set; }

        public GenerateItemResult(bool wasSuccessful, string type, string item)
        {
            WasSuccessful = wasSuccessful;
            Type = type;
            Item = item;
        }

        public static GenerateItemResult Success(string type, string item, string message = null)
        {
            return new GenerateItemResult(true, type, item) { Message = message };
        }

        public static GenerateItemResult Error(string type, string item, string message = null)
        {
            return new GenerateItemResult(false, type, item) { Message = message };
        }
    }
}
