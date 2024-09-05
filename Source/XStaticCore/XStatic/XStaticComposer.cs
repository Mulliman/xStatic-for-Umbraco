using System.Linq;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Core.Notifications;
using XStatic.Core.App;
using XStatic.Core.AutoPublish;
using XStatic.Core.Repositories;
using XStatic.Db;
using XStatic.Security;

namespace XStatic
{
    public class XStaticComposer : IComposer
    {
        public void Compose(IUmbracoBuilder builder)
        {
            var isManuallyInstalled = builder.Services.Any(x => x.ServiceType == typeof(ISitesRepository));

            if (!isManuallyInstalled)
            {
                builder.Services.AddXStatic()
                    .Automatic()
                    .UseSecureUserGroups()
                    .Build();
            }

            builder.AddNotificationHandler<UmbracoApplicationStartingNotification, XStaticDatabaseNotificationHandler>();
            builder.AddNotificationAsyncHandler<UmbracoApplicationStartedNotification, AddXStaticRolesNotificationHandler>();
            builder.AddNotificationAsyncHandler<ContentPublishedNotification, AutoPublishNotificationHandler>();
        }
    }
}