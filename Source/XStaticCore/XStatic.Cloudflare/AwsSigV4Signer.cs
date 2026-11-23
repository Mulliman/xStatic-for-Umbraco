using System;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;

namespace XStatic.Cloudflare
{
    /// <summary>
    /// Minimal AWS Signature Version 4 (SigV4) request signer for Cloudflare R2 S3-compatible PUT requests.
    /// </summary>
    public static class AwsSigV4Signer
    {
        public const string DefaultRegion = "auto";
        public const string ServiceName = "s3";

        public static void SignRequest(
            HttpRequestMessage request,
            byte[] payload,
            string accessKeyId,
            string secretAccessKey,
            DateTimeOffset utcNow,
            string region = DefaultRegion)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (request.RequestUri == null) throw new ArgumentException("Request URI is required.", nameof(request));
            if (string.IsNullOrWhiteSpace(accessKeyId)) throw new ArgumentException("Access Key ID is required.", nameof(accessKeyId));
            if (string.IsNullOrWhiteSpace(secretAccessKey)) throw new ArgumentException("Secret Access Key is required.", nameof(secretAccessKey));

            payload ??= Array.Empty<byte>();
            var payloadHash = ToLowerHex(SHA256.HashData(payload));

            var amzDate = utcNow.UtcDateTime.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
            var dateStamp = utcNow.UtcDateTime.ToString("yyyyMMdd", CultureInfo.InvariantCulture);

            var host = request.RequestUri.IsDefaultPort
                ? request.RequestUri.Host
                : $"{request.RequestUri.Host}:{request.RequestUri.Port}";

            request.Headers.Host = host;
            request.Headers.Remove("x-amz-date");
            request.Headers.TryAddWithoutValidation("x-amz-date", amzDate);
            request.Headers.Remove("x-amz-content-sha256");
            request.Headers.TryAddWithoutValidation("x-amz-content-sha256", payloadHash);

            var canonicalUri = EncodePath(request.RequestUri.AbsolutePath);
            var canonicalQueryString = BuildCanonicalQueryString(request.RequestUri.Query);

            var canonicalHeaders =
                $"host:{host}\n" +
                $"x-amz-content-sha256:{payloadHash}\n" +
                $"x-amz-date:{amzDate}\n";

            const string signedHeaders = "host;x-amz-content-sha256;x-amz-date";

            var canonicalRequest = string.Join("\n",
                request.Method.Method,
                canonicalUri,
                canonicalQueryString,
                canonicalHeaders,
                signedHeaders,
                payloadHash);

            var credentialScope = $"{dateStamp}/{region}/{ServiceName}/aws4_request";
            var hashedCanonicalRequest = ToLowerHex(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalRequest)));

            var stringToSign = string.Join("\n",
                "AWS4-HMAC-SHA256",
                amzDate,
                credentialScope,
                hashedCanonicalRequest);

            var signingKey = DeriveSigningKey(secretAccessKey, dateStamp, region, ServiceName);
            var signature = ToLowerHex(HmacSha256(signingKey, stringToSign));

            var authorizationHeader =
                $"AWS4-HMAC-SHA256 Credential={accessKeyId}/{credentialScope}, SignedHeaders={signedHeaders}, Signature={signature}";

            request.Headers.Remove("Authorization");
            request.Headers.TryAddWithoutValidation("Authorization", authorizationHeader);
        }

        private static byte[] DeriveSigningKey(string secretKey, string dateStamp, string region, string service)
        {
            var kDate = HmacSha256(Encoding.UTF8.GetBytes("AWS4" + secretKey), dateStamp);
            var kRegion = HmacSha256(kDate, region);
            var kService = HmacSha256(kRegion, service);
            return HmacSha256(kService, "aws4_request");
        }

        private static byte[] HmacSha256(byte[] key, string data)
        {
            using var hmac = new HMACSHA256(key);
            return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        }

        private static string EncodePath(string absolutePath)
        {
            if (string.IsNullOrEmpty(absolutePath) || absolutePath == "/")
            {
                return "/";
            }

            var segments = absolutePath.Split('/');
            return string.Join("/", segments.Select(s => Uri.EscapeDataString(Uri.UnescapeDataString(s))));
        }

        private static string BuildCanonicalQueryString(string query)
        {
            if (string.IsNullOrEmpty(query) || query == "?")
            {
                return string.Empty;
            }

            var pairs = query.TrimStart('?')
                .Split('&', StringSplitOptions.RemoveEmptyEntries)
                .Select(p =>
                {
                    var idx = p.IndexOf('=');
                    var key = idx >= 0 ? p.Substring(0, idx) : p;
                    var val = idx >= 0 ? p.Substring(idx + 1) : string.Empty;
                    return (
                        Key: Uri.EscapeDataString(Uri.UnescapeDataString(key)),
                        Value: Uri.EscapeDataString(Uri.UnescapeDataString(val))
                    );
                })
                .OrderBy(p => p.Key, StringComparer.Ordinal)
                .ThenBy(p => p.Value, StringComparer.Ordinal);

            return string.Join("&", pairs.Select(p => $"{p.Key}={p.Value}"));
        }

        private static string ToLowerHex(byte[] bytes)
        {
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }
}
