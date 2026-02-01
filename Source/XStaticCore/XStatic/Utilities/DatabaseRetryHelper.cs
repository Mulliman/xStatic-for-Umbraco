using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace XStatic.Utilities
{
    public static class DatabaseRetryHelper
    {
        public static async Task ExecuteWithRetryAsync(
            Func<Task> action,
            ILogger logger,
            string operationName,
            int maxRetries = 3,
            int delayMilliseconds = 1000)
        {
            int retries = maxRetries;
            while (true)
            {
                try
                {
                    await action();
                    return;
                }
                catch (Exception ex)
                {
                    if (retries > 0 && IsDatabaseLocked(ex))
                    {
                        logger.LogWarning(ex, "xStatic - Database locked during {OperationName}. Retrying in {Delay}ms... (Retries left: {Retries})", operationName, delayMilliseconds, retries);
                        retries--;
                        await Task.Delay(delayMilliseconds);
                    }
                    else
                    {
                        logger.LogError(ex, "xStatic - Failed to complete {OperationName}.", operationName);
                        throw;
                    }
                }
            }
        }

        private static bool IsDatabaseLocked(Exception ex)
        {
            return ex.ToString().Contains("database table is locked");
        }
    }
}
