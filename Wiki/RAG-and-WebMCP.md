Turn your generated static Umbraco site into structured, token-friendly chunks for Retrieval-Augmented Generation (RAG) and a lightweight `webmcp-index.json` file for browser agents and client-side search. Everything lives in `xStatic.Core` with zero external AI SDK dependencies.

## At a glance

- **Action type**: `RagExportPostGenerationAction` ([source](../Source/XStaticCore/XStatic.Core/Actions/RagExportPostGenerationAction.cs)), auto-registered by `AddXStatic().Automatic()`.
- **Output formats**: `Jsonl` (`rag-chunks.jsonl`), `Json` (`rag-chunks.json`), or `Markdown` (`rag-chunks/*.md` with YAML frontmatter).
- **WebMCP index**: `webmcp-index.json` at the site root with read-only tool descriptors (`search_site_content`, `get_page_chunks`) and per-page summaries.
- **Vector stores**: implement `IVectorStorePusher` or `VectorStorePusherBase` to push chunks to Cloudflare Vectorize, Azure AI Search, Pinecone, Qdrant or any other store after generation.

## Set up the post-generation action

No code changes are needed to start exporting chunks and `webmcp-index.json`.

1. Open the **xStatic** section and select the **Actions** tab.
2. Select **Create new Action**.
3. Enter an **Action Name**, for example `Export RAG Chunks & WebMCP Index`.
4. Choose `RagExportPostGenerationAction` as the **Action Type**.
5. Fill in any optional fields you want to override:

| Field | Default | Meaning |
|-------|---------|---------|
| **OutputFormat** | `Jsonl` | `Jsonl`, `Json`, or `Markdown` (case-insensitive). |
| **OutputPath** | `rag-chunks.jsonl` (`rag-chunks.json` for JSON, `rag-chunks` for Markdown) | Relative path inside the site's output folder. Paths outside the output root are rejected. |
| **MaxChunkSize** | `1000` | Maximum characters per chunk. |
| **ChunkOverlap** | `150` | Character overlap between consecutive chunks when a long section is split (clamped to half of `MaxChunkSize`). |
| **SplitOnHeadings** | `true` | Splits content at `h1`–`h6` headings and records the hierarchy in `headingPath`. |
| **ExcludedPaths** | none | Comma- or newline-separated paths or wildcard prefixes to skip, such as `/404, /search, /admin/*`. |
| **ExcludedDocTypes** | none | Comma- or newline-separated Umbraco document type aliases to skip, such as `xmlSitemap, errorPage`. |
| **CustomPropertyAliases** | none | Comma- or newline-separated Umbraco property aliases to copy into each chunk's `metadata` object. |
| **GenerateWebMcpIndex** | `true` | Writes `webmcp-index.json` alongside the chunk export. |
| **WebMcpIndexPath** | `webmcp-index.json` | Relative path inside the site's output folder for the WebMCP index. |

6. Select **Submit**, attach the action to your site under **Post Generation Actions**, and select **Generate**.

The generated files appear inside `umbraco/Data/xStatic/output/{siteId}/` and are included when you download or deploy the site.

## Output formats

### JSONL (`rag-chunks.jsonl`)

One compact JSON object per line, suited to streaming ingestion and batch embedding jobs:

```json
{"id":"https://example.com/docs/#chunk-0","url":"https://example.com/docs/","title":"Docs","heading":"Installation","headingPath":["Docs","Installation"],"chunkIndex":0,"totalChunks":3,"content":"...","characterCount":420,"estimatedTokenCount":105,"contentHash":"...","docType":"docPage","lastModified":"2026-05-01T12:00:00+00:00","culture":"en-US","metadata":{"description":"..."}}
```

### JSON (`rag-chunks.json`)

A single JSON envelope containing `schemaVersion`, `generatedAt`, `siteName`, `baseUrl`, `totalChunks` and a `chunks` array.

### Markdown (`rag-chunks/*.md`)

One Markdown file per chunk with YAML frontmatter (`id`, `url`, `title`, `heading`, `heading_path`, `chunk_index`, `total_chunks`, `estimated_tokens`, `doc_type`, `culture`, `last_modified`, `content_hash`) followed by the heading and extracted plain text. File names include a short URL hash (`{slug}-{hash8}-chunk-0000.md`) to avoid collisions, and stale `.md` files in the target folder are cleaned before each export.

## WebMCP index (`webmcp-index.json`)

When **GenerateWebMcpIndex** is enabled, xStatic writes `webmcp-index.json` containing:

- Site metadata (`schemaVersion`, `generatedAt`, `siteName`, `baseUrl`, `chunksPath`, `chunksFormat`).
- Read-only WebMCP tool descriptors (`search_site_content` and `get_page_chunks`) with JSON Schema `inputSchema` definitions.
- Per-page entries (`url`, `title`, `description`, `summary`, `docType`, `culture`, `lastModified`, `headings`, `keywords`, `chunkIds`, `chunkCount`, plus `chunkFiles` in Markdown mode).

If your site's **Target Hostname** omits the scheme (for example `example.com`), `https://` is added automatically when building canonical URLs.

## Pushing chunks to a vector store

`xStatic.Core` does not bundle vendor vector-database SDKs. To push chunks automatically after each build, implement `IVectorStorePusher` or inherit from `VectorStorePusherBase` ([source](../Source/XStaticCore/XStatic.Core/Rag/IVectorStorePusher.cs)):

```csharp
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using XStatic.Core.Rag;

public class MyVectorStorePusher : VectorStorePusherBase
{
    public override string Name => "MyVectorStore";

    protected override int BatchSize => 50;

    protected override async Task<int> UpsertBatchAsync(
        IReadOnlyList<RagChunk> batch,
        VectorStorePushContext context,
        CancellationToken cancellationToken)
    {
        // Generate embeddings and upsert into Cloudflare Vectorize,
        // Azure AI Search, Pinecone, Qdrant, etc.
        // Use chunk.ContentHash to skip unchanged chunks.
        return batch.Count;
    }
}
```

Register your pusher in `Program.cs`:

```csharp
using XStatic.Core.Rag;

builder.Services.AddTransient<IVectorStorePusher, MyVectorStorePusher>();
```

`IRagExportService` calls every registered `IVectorStorePusher` after writing the chunk files and `webmcp-index.json`. If one pusher fails, the error is recorded without skipping other pushers.

## Limitations

- Only HTML pages generated in the site's output folder are indexed; PDFs and binary media files are not chunked.
- Umbraco metadata enrichment (`docType`, `CustomPropertyAliases`) matches generated pages against published content by URL; pages that don't map to an Umbraco content node still export with HTML-derived metadata.

## Next steps

- Add companion `.md` pages and `/llms.txt` with [AI and GEO](AI-and-GEO.md).
- Connect AI assistants directly to xStatic via [MCP server and agent skill](MCP-Server-and-Agent-Skill.md).
- Review all built-in actions on [Post-generation actions](Post-Generation-Actions.md).
