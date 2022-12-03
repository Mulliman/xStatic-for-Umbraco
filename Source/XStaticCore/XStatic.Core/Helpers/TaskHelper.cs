using System;
using System.Threading.Tasks;

namespace XStatic.Core.Helpers
{
    public static class TaskHelper
    {
        public static Task FromResultOf(Action action)
        {
            try
            {
                action();
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                return Task.FromException(ex);
            }
        }

        public static Task<T> FromResultOf<T>(Func<T> func)
        {
            try
            {
                return Task.FromResult(func());
            }
            catch (Exception ex)
            {
                return Task.FromException<T>(ex);
            }
        }
    }
}
