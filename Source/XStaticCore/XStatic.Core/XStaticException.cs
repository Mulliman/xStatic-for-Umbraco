using System;

namespace XStatic.Common
{
    public class XStaticException : Exception
    {
        public XStaticException(string message) : base(message)
        {
        }
    }
}