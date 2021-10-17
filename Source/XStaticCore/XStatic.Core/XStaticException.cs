using System;

namespace XStatic.Core
{
    public class XStaticException : Exception
    {
        public XStaticException(string message) : base(message)
        {
        }
    }
}