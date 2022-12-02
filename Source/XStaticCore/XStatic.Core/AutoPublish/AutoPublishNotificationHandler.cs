using System.Threading;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace XStatic.Core.AutoPublish
{
    public class AutoPublishNotificationHandler : INotificationAsyncHandler<ContentPublishedNotification>
    {
        private readonly IAutoPublisher _publisher;

        public AutoPublishNotificationHandler(IAutoPublisher publisher)
        {
            _publisher = publisher;
        }

        public Task HandleAsync(ContentPublishedNotification notification, CancellationToken cancellationToken)
        {
            var publishedEntities = notification.PublishedEntities;

            return _publisher.RunAutoPublish(publishedEntities);
        }
    }
}