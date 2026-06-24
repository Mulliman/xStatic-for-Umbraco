using System.Threading.Tasks;

namespace XStatic.Core.Services
{
    public interface IAiService
    {
        Task<string> GenerateDescriptionAsync(string content);
    }
}
