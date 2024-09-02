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

    public class XStaticResult<T> : XStaticResult
    {
        public T Data { get; set; }

        public static XStaticResult<T> Success(T data)
        {
            return new XStaticResult<T>() { WasSuccessful = true, Data = data };
        }

        public static XStaticResult<T> Success(T data, string message)
        {
            return new XStaticResult<T>() { WasSuccessful = true, Data = data, Message = message };
        }

        public new static XStaticResult<T> Error()
        {
            return new XStaticResult<T>() { WasSuccessful = false };
        }

        public new static XStaticResult<T> Error(string message)
        {
            return new XStaticResult<T>() { WasSuccessful = false, Message = message };
        }

        public new static XStaticResult<T> Error(string message, Exception ex)
        {
            return new XStaticResult<T>() { WasSuccessful = false, Message = message, Exception = ex };
        }   
    }
}