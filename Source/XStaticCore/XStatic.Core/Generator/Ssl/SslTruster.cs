using System.Configuration;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

namespace XStatic.Core.Generator.Ssl
{
    public static class SslTruster
    {
        public static void TrustSslIfAppSettingConfigured()
        {
            if (ConfigurationManager.AppSettings.Get("xStatic.TrustSsl") == null)
            {
                return;
            }

            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            ServicePointManager.ServerCertificateValidationCallback = (sender, certificate, chain, sslPolicyErrors) => true;

            ServicePointManager.ServerCertificateValidationCallback = (sender, cert, chain, errors) => true;

            ServicePointManager.ServerCertificateValidationCallback += new RemoteCertificateValidationCallback(ValidateRemoteCertificate);
        }

        private static bool ValidateRemoteCertificate(object sender, X509Certificate cert, X509Chain chain, SslPolicyErrors policyErrors)
        {
            return true;
        }
    }
}