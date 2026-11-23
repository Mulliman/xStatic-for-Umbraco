using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace XStatic.Core.Models
{
    /// <summary>
    /// Safely serializes <see cref="Exception"/> instances with <c>System.Text.Json</c> without
    /// hitting <c>NotSupportedException</c> on <see cref="Exception.TargetSite"/> (<c>MethodBase</c>).
    /// </summary>
    public class SafeExceptionJsonConverter : JsonConverter<Exception>
    {
        public override Exception Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                return new Exception(reader.GetString());
            }

            if (reader.TokenType == JsonTokenType.StartObject)
            {
                using var doc = JsonDocument.ParseValue(ref reader);
                if (doc.RootElement.TryGetProperty("message", out var msgProp) && msgProp.ValueKind == JsonValueKind.String)
                {
                    return new Exception(msgProp.GetString());
                }

                if (doc.RootElement.TryGetProperty("Message", out var pascalMsgProp) && pascalMsgProp.ValueKind == JsonValueKind.String)
                {
                    return new Exception(pascalMsgProp.GetString());
                }

                return new Exception(doc.RootElement.GetRawText());
            }

            throw new JsonException($"Unexpected token {reader.TokenType} when reading {nameof(Exception)}.");
        }

        public override void Write(Utf8JsonWriter writer, Exception value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
                return;
            }

            writer.WriteStartObject();
            writer.WriteString("message", value.Message);
            writer.WriteString("type", value.GetType().FullName);

            if (value.InnerException != null)
            {
                writer.WritePropertyName("innerException");
                Write(writer, value.InnerException, options);
            }

            writer.WriteEndObject();
        }
    }
}
