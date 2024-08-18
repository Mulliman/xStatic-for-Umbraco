using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using XStatic.Core.AutoPublish;
using XStatic.Db;
using XStatic.Security;

namespace XStatic
{
    public class XStaticComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            builder.AddNotificationHandler<UmbracoApplicationStartingNotification, XStaticDatabaseNotificationHandler>();
            builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, AddXStaticRolesNotificationHandler>();
            builder.AddNotificationAsyncHandler<ContentPublishedNotification, AutoPublishNotificationHandler>();
        }
    }
}