using System;

namespace XStatic.Core
{
    public class XStaticResult : IXStaticWebResult
    {
        public bool WasSuccessful { get; set; }

        public string Message { get; set; }

        public Exception Exception { get; set; }

        public static XStaticResult Success()
        {
            return new XStaticResult() { WasSuccessful = true };
        }

        public static XStaticResult Success(string message)
        {
            return new XStaticResult() { WasSuccessful = true, Message = message };
        }

        public static XStaticResult Error()
        {
            return new XStaticResult() { WasSuccessful = false };
        }

        public static XStaticResult Error(string message)
        {
            return new XStaticResult() { WasSuccessful = false, Message = message };
        }

        public static XStaticResult Error(string message, Exception ex)
        {
            return new XStaticResult() { WasSuccessful = false, Message = message, Exception = ex };
        }
    }
}