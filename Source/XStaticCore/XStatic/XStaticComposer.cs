using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using XStatic.Core.AutoPublish;
using XStatic.Db;

namespace XStatic
{
    public class XStaticComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.AddNotificationHandler<UmbracoApplicationStartingNotification, XStaticDatabaseNotificationHandler>();
            builder.AddNotificationHandler<ContentPublishingNotification, AutoPublishNotificationHandler>();
        }
    }
}