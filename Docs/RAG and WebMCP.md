# Static RAG Chunk Exporter & WebMCP Index

xStatic includes a built-in post-generation pipeline that turns your static Umbraco site into structured, token-friendly RAG (Retrieval-Augmented Generation) chunks and an optional static `webmcp-index.json` file for client-side search, AI ingestion pipelines, and read-only WebMCP browser agents.

All components live in `XStatic.Core.Rag` and `XStatic.Core.Actions` with **zero external AI SDK dependencies**.

## 1. Configuring the Post-Generation Action

`RagExportPostGenerationAction` is automatically discovered by xStatic and registered by `GeneratorServiceBuilder.AddDefaultActions()` / `AddDefaultRagServices()`.

In the Umbraco backoffice:
1. Open **xStatic -> Actions** and create a new action using **RagExportPostGenerationAction**.
2. Configure any of the optional fields below:

| Field | Default | Description |
| --- | --- | --- |
| `OutputFormat` | `jsonl` | Export format: `json`, `jsonl`, or `markdown`. |
| `OutputPath` | `rag-chunks.jsonl` (`rag-chunks.json` for JSON, `rag-chunks` folder for Markdown) | Relative output path inside the generated site folder. |
| `MaxChunkSize` | `1000` | Maximum characters per chunk. |
| `ChunkOverlap` | `150` | Character overlap between consecutive chunks when splitting long sections. |
| `SplitOnHeadings` | `true` | Split content at HTML heading boundaries (`h1`–`h6`), preserving hierarchical `headingPath`. |
| `ExcludedPaths` | *(empty)* | Comma-separated paths or wildcard prefixes to skip (e.g., `/404, /search, /admin/*`). |
| `ExcludedDocTypes` | *(empty)* | Comma-separated Umbraco document type aliases to skip (e.g., `xmlSitemap, errorPage`). |
| `CustomPropertyAliases` | *(empty)* | Comma-separated Umbraco property aliases to include in each chunk's `metadata`. |
| `GenerateWebMcpIndex` | `true` | Whether to emit `webmcp-index.json`. |
| `WebMcpIndexPath` | `webmcp-index.json` | Relative path for the WebMCP static index file. |

3. Attach the action to any static site definition in xStatic.

## 2. Output Formats

### JSONL (`rag-chunks.jsonl`)
One compact JSON object per line—ideal for streaming into vector databases or batch embedding jobs:

```json
{"id":"https://example.com/docs/#chunk-0","url":"https://example.com/docs/","title":"Docs","heading":"Installation","headingPath":["Docs","Installation"],"chunkIndex":0,"totalChunks":3,"content":"...","characterCount":420,"estimatedTokenCount":105,"contentHash":"...","docType":"docPage","lastModified":"2026-05-01T12:00:00+00:00","culture":"en-US","metadata":{"description":"..."}}
```

### JSON (`rag-chunks.json`)
A structured envelope containing `schemaVersion`, `generatedAt`, `siteName`, `baseUrl`, `totalChunks`, and the `chunks` array.

### Markdown (`rag-chunks/*.md`)
One `.md` file per chunk with YAML frontmatter (`id`, `url`, `title`, `heading`, `heading_path`, `chunk_index`, `total_chunks`, `estimated_tokens`, `doc_type`, `culture`, `last_modified`, `content_hash`) followed by clean Markdown body text.

## 3. Static Agent / WebMCP Index (`webmcp-index.json`)

When `GenerateWebMcpIndex` is enabled, xStatic writes a lightweight `webmcp-index.json` at the root of the static site containing:
- Site metadata (`schemaVersion`, `generatedAt`, `siteName`, `baseUrl`, `chunksPath`, `chunksFormat`)
- Read-only WebMCP tool descriptors (`search_site_content`, `get_page_chunks`)
- Per-page index entries (`url`, `title`, `description`, `summary`, `docType`, `culture`, `lastModified`, `headings`, `keywords`, `chunkIds`, `chunkCount`)

## 4. Pushing Chunks to External Vector Stores

`XStatic.Core` intentionally avoids taking dependencies on vendor AI or vector-database SDKs. Instead, implement `IVectorStorePusher` (or inherit from `VectorStorePusherBase` for built-in batching and error handling) in your own project or deployer package:

```csharp
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using XStatic.Core.Rag;

public class CloudflareVectorizePusher : VectorStorePusherBase
{
    public override string Name => "CloudflareVectorize";

    protected override int BatchSize => 50;

    protected override async Task<int> UpsertBatchAsync(
        IReadOnlyList<RagChunk> batch,
        VectorStorePushContext context,
        CancellationToken cancellationToken)
    {
        // Generate embeddings and upsert batch into Cloudflare Vectorize,
        // Azure AI Search, Pinecone, Qdrant, etc.
        // Use chunk.ContentHash to skip unchanged chunks if desired.
        return batch.Count;
    }
}
```

Register your pusher in DI:

```csharp
services.AddTransient<IVectorStorePusher, CloudflareVectorizePusher>();
```

All registered `IVectorStorePusher` implementations are automatically invoked by `IRagExportService` after chunks and `webmcp-index.json` are written.
