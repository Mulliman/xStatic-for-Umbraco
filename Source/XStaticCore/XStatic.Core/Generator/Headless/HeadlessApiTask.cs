using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Core.Generator.Headless
{
    public class HeadlessApiTask
    {
        public HeadlessApiTask(string apiPath, string storagePath)
        {
            ApiPath = apiPath;
            StoragePath = storagePath;
        }

        public HeadlessApiTask(string apiPath, string storagePath, Dictionary<string, string> headers)
        {
            ApiPath = apiPath;
            StoragePath = storagePath;
            Headers = headers;
        }

        public string ApiPath { get; set; }

        public string StoragePath { get; set; }

        public Dictionary<string, string> Headers { get; set; }
    }
}