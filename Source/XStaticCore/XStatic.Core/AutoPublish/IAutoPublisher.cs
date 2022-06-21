using System.Collections.Generic;
using Umbraco.Cms.Core.Models;

namespace XStatic.Core.AutoPublish
{
    public interface IAutoPublisher
    {
        void RunAutoPublish(IEnumerable<IContent> publishedEntities);
    }
}