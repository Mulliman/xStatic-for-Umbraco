using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace XStatic.Generator.Ssl
{
    public static class SslTruster
    {
        public static void TrustSslIfAppSettingConfigured()
        {
            if(ConfigurationManager.AppSettings.Get("xStatic.TrustSsl") == null)
            {
                return;
            }

            System.Net.ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            System.Net.ServicePointManager.ServerCertificateValidationCallback = ((sender, certificate, chain, sslPolicyErrors) => true);

            System.Net.ServicePointManager.ServerCertificateValidationCallback = ((sender, cert, chain, errors) => true);

            ServicePointManager.ServerCertificateValidationCallback += new RemoteCertificateValidationCallback(ValidateRemoteCertificate);
        }

        private static bool ValidateRemoteCertificate(object sender, X509Certificate cert, X509Chain chain, SslPolicyErrors policyErrors)
        {
            return true;
        }
    }
}