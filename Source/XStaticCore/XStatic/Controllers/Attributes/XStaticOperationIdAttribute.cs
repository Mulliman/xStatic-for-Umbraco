using System;

namespace XStatic.Controllers.Attributes
{
    /// <summary>
    /// Declares the OpenAPI <c>operationId</c> for an xStatic Management API action without emitting
    /// ASP.NET Core <c>IEndpointNameMetadata</c>, which causes duplicate endpoint name exceptions under
    /// Umbraco's <c>MapDynamicControllerRoute</c>.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public sealed class XStaticOperationIdAttribute(string operationId) : Attribute
    {
        public string OperationId { get; } = operationId;
    }
}
