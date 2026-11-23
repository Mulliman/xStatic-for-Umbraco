using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;

namespace XStatic.AI.Configuration;

/// <summary>
/// Resolves an <see cref="IChatClient"/> for xStatic AI operations.
/// Allows seamless bridging to <c>Umbraco.AI</c> profiles or standalone <c>Microsoft.Extensions.AI</c> registrations.
/// </summary>
public interface IXStaticChatClientResolver
{
    /// <summary>
    /// Resolves an <see cref="IChatClient"/> for the optional <paramref name="profileAlias"/>.
    /// Returns <c>null</c> if no chat client is registered.
    /// </summary>
    IChatClient? Resolve(string? profileAlias = null);
}

/// <summary>
/// Delegate factory for resolving a profile-aware <see cref="IChatClient"/> (for example via <c>Umbraco.AI</c>).
/// </summary>
public delegate IChatClient? XStaticChatClientFactory(IServiceProvider serviceProvider, string? profileAlias);

/// <summary>
/// Default implementation of <see cref="IXStaticChatClientResolver"/> that delegates to a registered
/// <see cref="XStaticChatClientFactory"/> if present, then checks keyed <see cref="IChatClient"/> services
/// by <paramref name="profileAlias"/>, and finally falls back to the default <see cref="IChatClient"/> in DI.
/// </summary>
public class DefaultXStaticChatClientResolver : IXStaticChatClientResolver
{
    private readonly IServiceProvider _serviceProvider;
    private readonly XStaticChatClientFactory? _factory;

    public DefaultXStaticChatClientResolver(
        IServiceProvider serviceProvider,
        XStaticChatClientFactory? factory = null)
    {
        _serviceProvider = serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));
        _factory = factory;
    }

    public IChatClient? Resolve(string? profileAlias = null)
    {
        if (_factory is not null)
        {
            var fromFactory = _factory(_serviceProvider, profileAlias);
            if (fromFactory is not null)
            {
                return fromFactory;
            }
        }

        if (!string.IsNullOrWhiteSpace(profileAlias))
        {
            var keyedClient = _serviceProvider.GetKeyedService<IChatClient>(profileAlias);
            if (keyedClient is not null)
            {
                return keyedClient;
            }
        }

        return _serviceProvider.GetService<IChatClient>();
    }
}
