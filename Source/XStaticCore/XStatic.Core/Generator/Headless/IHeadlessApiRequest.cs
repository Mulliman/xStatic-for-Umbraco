namespace XStatic.Core.Generator.Headless
{
    public interface IHeadlessApiRequest
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string RequestUrlFormat { get; set; }

        public string StorageUrlFormat { get; set; }

        public string SpecificStartItem { get; set; }

        public string SpecificCulture { get; set; }

        public bool UsePreview { get; set; }
    }
}
