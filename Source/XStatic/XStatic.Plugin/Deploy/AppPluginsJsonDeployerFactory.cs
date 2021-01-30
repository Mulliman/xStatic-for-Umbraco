using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography.Xml;
using System.Text;
using System.Threading.Tasks;
using System.Web.Hosting;
using XStatic.Deploy;

namespace XStatic.Plugin.Deploy
{
    public class AppPluginsJsonDeployerFactory : IDeployerFactory
    {
        private const string FileLocation = @"~\App_Plugins\xStatic\xStaticConfig.json";

        public IDeployer GetDeployer(string deployerKey, Dictionary<string, string> properties)
        {
            var file = HostingEnvironment.MapPath(FileLocation);

            if (!File.Exists(file))
            {
                var backupFactory = new DeployerFactory();
                return backupFactory.GetDeployer(deployerKey, properties);
            }

            try
            {
                var config = JsonConvert.DeserializeObject<Config>(File.ReadAllText(file));
                var deployer = config?.deployers?.FirstOrDefault(et => et?.id == deployerKey);

                if (deployer?.deployer == null)
                {
                    throw new Exception("Deployer not set");
                }

                var typeName = deployer?.deployer;
                var type = Type.GetType(typeName);

                var instance = Activator.CreateInstance(type, properties) as IDeployer;
                return instance;
            }
            catch
            {
                throw new Exception("Deployer creation exception.");
            }
        }
    }

    public class Config
    {
        public IEnumerable<Deployer> deployers { get; set; }
    }

    public class Deployer
    {
        public string id { get; set; }

        public string deployer { get; set; }
    }
}