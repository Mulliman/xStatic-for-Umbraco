using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.Services;

namespace XStatic.Core.AutoPublish
{
    public class AutoPublishNotificationHandler(IAutoPublisher publisher, IRuntimeState runtimeState) : INotificationAsyncHandler<ContentPublishedNotification>
    {
        private readonly IAutoPublisher _publisher = publisher;
        private readonly IRuntimeState _runtimeState = runtimeState;

        public Task HandleAsync(ContentPublishedNotification notification, CancellationToken cancellationToken)
        {
            if (_runtimeState.Level < RuntimeLevel.Run)
            {
                return Task.CompletedTask;
            }

            var publishedEntities = notification.PublishedEntities;

            return _publisher.RunAutoPublish(publishedEntities);
        }
    }
}