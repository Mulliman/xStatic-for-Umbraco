using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using XStatic.Core.App;

namespace XStatic.Core.Services
{
    public class UmbracoAiService : IAiService
    {
        private readonly ILogger<UmbracoAiService> _logger;
        private readonly XStaticGlobalSettings _settings;
        private readonly IHttpClientFactory _httpClientFactory;

        public UmbracoAiService(ILogger<UmbracoAiService> logger, IOptions<XStaticGlobalSettings> settings, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _settings = settings.Value;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<string> GenerateDescriptionAsync(string content)
        {
            if (!_settings.Ai.Enabled)
            {
                return null;
            }

            try
            {
                // If a specific provider URL is configured, try to call it
                if (!string.IsNullOrEmpty(_settings.Ai.Provider) && _settings.Ai.Provider.StartsWith("http"))
                {
                    var client = _httpClientFactory.CreateClient();

                     _logger.LogInformation("Calling configured AI provider: {Provider}", _settings.Ai.Provider);

                     // Placeholder for actual call
                     // In a real implementation:
                     // var response = await client.PostAsJsonAsync(_settings.Ai.Provider, requestPayload);
                     // return ParseResponse(response);

                     // For now, we return null to avoid junk in production unless explicitly simulated via a test endpoint
                     if (_settings.Ai.Provider.Contains("test-simulation"))
                     {
                        return "AI Generated Description (Simulation)";
                     }

                     return null;
                }

                // If no provider URL is set but enabled, we log a warning and return null.
                // We do NOT return simulated text by default.
                _logger.LogWarning("AI Meta Description generation is enabled but no Provider URL is configured.");

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI description");
                return null;
            }
        }
    }
}
