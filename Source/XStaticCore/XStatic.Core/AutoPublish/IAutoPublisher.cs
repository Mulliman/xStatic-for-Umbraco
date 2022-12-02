using System.Collections.Generic;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Models;

namespace XStatic.Core.AutoPublish
{
    public interface IAutoPublisher
    {
        Task RunAutoPublish(IEnumerable<IContent> publishedEntities);
    }
}