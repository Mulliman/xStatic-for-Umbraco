using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace XStatic.Core.Models
{
    /// <summary>
    /// Deserializes JSON object maps into <see cref="Dictionary{TKey, TValue}"/> of strings,
    /// safely coercing JSON booleans and numbers (such as Umbraco Toggle or Integer property editors)
    /// into their string representations.
    /// </summary>
    public class StringValueDictionaryJsonConverter : JsonConverter<Dictionary<string, string>>
    {
        public override Dictionary<string, string> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
            {
                return null;
            }

            if (reader.TokenType != JsonTokenType.StartObject)
            {
                throw new JsonException($"Expected JSON object for {nameof(Dictionary<string, string>)}, got {reader.TokenType}.");
            }

            var result = new Dictionary<string, string>();

            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    return result;
                }

                if (reader.TokenType != JsonTokenType.PropertyName)
                {
                    throw new JsonException($"Expected property name, got {reader.TokenType}.");
                }

                var key = reader.GetString();

                if (!reader.Read())
                {
                    throw new JsonException($"Unexpected end of JSON while reading value for '{key}'.");
                }

                result[key] = ReadValueAsString(ref reader);
            }

            throw new JsonException("Unexpected end of JSON object.");
        }

        private static string ReadValueAsString(ref Utf8JsonReader reader)
        {
            switch (reader.TokenType)
            {
                case JsonTokenType.Null:
                    return null;

                case JsonTokenType.String:
                    return reader.GetString();

                case JsonTokenType.True:
                    return "true";

                case JsonTokenType.False:
                    return "false";

                case JsonTokenType.Number:
                    if (reader.TryGetInt64(out var intVal))
                    {
                        return intVal.ToString(CultureInfo.InvariantCulture);
                    }

                    if (reader.TryGetDecimal(out var decVal))
                    {
                        return decVal.ToString(CultureInfo.InvariantCulture);
                    }

                    return reader.GetDouble().ToString(CultureInfo.InvariantCulture);

                case JsonTokenType.StartArray:
                case JsonTokenType.StartObject:
                    using (var doc = JsonDocument.ParseValue(ref reader))
                    {
                        return doc.RootElement.GetRawText();
                    }

                default:
                    throw new JsonException($"Unsupported JSON token {reader.TokenType} for string dictionary value.");
            }
        }

        public override void Write(Utf8JsonWriter writer, Dictionary<string, string> value, JsonSerializerOptions options)
        {
            if (value == null)
            {
                writer.WriteNullValue();
                return;
            }

            writer.WriteStartObject();
            foreach (var kvp in value)
            {
                if (kvp.Value == null)
                {
                    writer.WriteNull(kvp.Key);
                }
                else
                {
                    writer.WriteString(kvp.Key, kvp.Value);
                }
            }

            writer.WriteEndObject();
        }
    }
}
