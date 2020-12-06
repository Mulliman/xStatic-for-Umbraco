using System.IO;
using System.Threading.Tasks;

namespace XStatic.Generator.Storage
{
    public class AppDataSiteStorer : IStaticSiteStorer
    {
        public async Task<string> StoreSiteItem(string subFolder, string path, string contents, System.Text.Encoding encoding)
        {
            string storagePath = System.Web.Hosting.HostingEnvironment.MapPath("/App_Data/xStatic/output/" + subFolder + "/" + path);
            string root = System.Web.Hosting.HostingEnvironment.MapPath("~/");
            var filePath = Path.Combine(root, storagePath);

            var fi = new System.IO.FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            System.IO.File.WriteAllText(storagePath, contents, encoding);

            return filePath;
        }

        public async Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath)
        {
            string storagePath = System.Web.Hosting.HostingEnvironment.MapPath("/App_Data/xStatic/output/" + subFolder + "/" + partialDestinationPath);
            string root = System.Web.Hosting.HostingEnvironment.MapPath("~/");
            var filePath = Path.Combine(root, storagePath);

            var fi = new System.IO.FileInfo(filePath);
            if (fi.Exists) fi.Delete();
            if (!fi.Directory.Exists) fi.Directory.Create();

            System.IO.File.Copy(sourcePath, filePath);

            return filePath;
        }
    }
}