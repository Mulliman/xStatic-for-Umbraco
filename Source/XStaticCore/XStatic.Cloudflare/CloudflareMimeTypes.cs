using System;
using System.Collections.Generic;
using System.IO;

namespace XStatic.Cloudflare
{
    public static class CloudflareMimeTypes
    {
        private static readonly Dictionary<string, string> ExtensionMap = new(StringComparer.OrdinalIgnoreCase)
        {
            [".html"] = "text/html; charset=utf-8",
            [".htm"] = "text/html; charset=utf-8",
            [".md"] = "text/markdown; charset=utf-8",
            [".markdown"] = "text/markdown; charset=utf-8",
            [".txt"] = "text/plain; charset=utf-8",
            [".css"] = "text/css; charset=utf-8",
            [".js"] = "application/javascript; charset=utf-8",
            [".mjs"] = "application/javascript; charset=utf-8",
            [".json"] = "application/json; charset=utf-8",
            [".xml"] = "application/xml; charset=utf-8",
            [".svg"] = "image/svg+xml",
            [".png"] = "image/png",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".gif"] = "image/gif",
            [".webp"] = "image/webp",
            [".avif"] = "image/avif",
            [".ico"] = "image/x-icon",
            [".woff"] = "font/woff",
            [".woff2"] = "font/woff2",
            [".ttf"] = "font/ttf",
            [".otf"] = "font/otf",
            [".eot"] = "application/vnd.ms-fontobject",
            [".pdf"] = "application/pdf",
            [".zip"] = "application/zip",
            [".wasm"] = "application/wasm",
            [".webmanifest"] = "application/manifest+json",
            [".map"] = "application/json"
        };

        public static string GetContentType(string filePath)
        {
            if (string.IsNullOrWhiteSpace(filePath))
            {
                return "application/octet-stream";
            }

            var fileName = Path.GetFileName(filePath);
            if (string.Equals(fileName, "_headers", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(fileName, "_redirects", StringComparison.OrdinalIgnoreCase))
            {
                return "text/plain; charset=utf-8";
            }

            var extension = Path.GetExtension(filePath);
            if (!string.IsNullOrEmpty(extension) && ExtensionMap.TryGetValue(extension, out var mimeType))
            {
                return mimeType;
            }

            return "application/octet-stream";
        }
    }
}
