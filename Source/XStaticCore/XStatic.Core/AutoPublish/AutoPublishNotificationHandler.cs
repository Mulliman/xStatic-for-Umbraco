using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;

namespace XStatic.Core.AutoPublish
{
    public class AutoPublishNotificationHandler : INotificationHandler<ContentPublishingNotification>
    {
        private readonly IAutoPublisher _publisher;

        public AutoPublishNotificationHandler(IAutoPublisher publisher)
        {
            _publisher = publisher;
        }

        public void Handle(ContentPublishingNotification notification)
        {
            var publishedEntities = notification.PublishedEntities;

            _publisher.RunAutoPublish(publishedEntities);
        }
    }
}