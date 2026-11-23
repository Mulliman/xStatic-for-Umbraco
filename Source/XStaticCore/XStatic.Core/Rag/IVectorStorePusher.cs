using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace XStatic.Core.Rag
{
    public interface IVectorStorePusher
    {
        string Name { get; }

        Task<VectorStorePushResult> PushAsync(VectorStorePushContext context, CancellationToken cancellationToken = default);
    }

    public class VectorStorePushContext
    {
        public int StaticSiteId { get; set; }

        public string SiteName { get; set; }

        public string BaseUrl { get; set; }

        public IReadOnlyList<RagChunk> Chunks { get; set; } = Array.Empty<RagChunk>();

        public WebMcpIndex WebMcpIndex { get; set; }

        public RagExportOptions Options { get; set; }

        public IDictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    }

    public class VectorStorePushResult
    {
        public string PusherName { get; set; }

        public bool WasSuccessful { get; set; }

        public int UpsertedCount { get; set; }

        public int SkippedCount { get; set; }

        public string Message { get; set; }

        public Exception Exception { get; set; }

        public static VectorStorePushResult Success(string pusherName, int upsertedCount, int skippedCount = 0, string message = null)
        {
            return new VectorStorePushResult
            {
                PusherName = pusherName,
                WasSuccessful = true,
                UpsertedCount = upsertedCount,
                SkippedCount = skippedCount,
                Message = message ?? $"Upserted {upsertedCount} chunk(s)."
            };
        }

        public static VectorStorePushResult Error(string pusherName, string message, Exception ex = null)
        {
            return new VectorStorePushResult
            {
                PusherName = pusherName,
                WasSuccessful = false,
                Message = message,
                Exception = ex
            };
        }
    }

    public abstract class VectorStorePusherBase : IVectorStorePusher
    {
        public abstract string Name { get; }

        protected virtual int BatchSize => 100;

        public async Task<VectorStorePushResult> PushAsync(VectorStorePushContext context, CancellationToken cancellationToken = default)
        {
            if (context == null)
            {
                return VectorStorePushResult.Error(Name, "Push context cannot be null.");
            }

            var chunks = context.Chunks ?? Array.Empty<RagChunk>();
            if (chunks.Count == 0)
            {
                return VectorStorePushResult.Success(Name, 0, 0, "No chunks to push.");
            }

            try
            {
                await OnBeforePushAsync(context, cancellationToken).ConfigureAwait(false);

                var batchSize = BatchSize > 0 ? BatchSize : 100;
                var totalUpserted = 0;

                for (var offset = 0; offset < chunks.Count; offset += batchSize)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    var count = Math.Min(batchSize, chunks.Count - offset);
                    var batch = new List<RagChunk>(count);
                    for (var i = 0; i < count; i++)
                    {
                        batch.Add(chunks[offset + i]);
                    }

                    totalUpserted += await UpsertBatchAsync(batch, context, cancellationToken).ConfigureAwait(false);
                }

                await OnAfterPushAsync(context, totalUpserted, cancellationToken).ConfigureAwait(false);

                var skipped = Math.Max(0, chunks.Count - totalUpserted);
                return VectorStorePushResult.Success(Name, totalUpserted, skipped);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                return VectorStorePushResult.Error(Name, $"Vector store push failed for '{Name}': {ex.Message}", ex);
            }
        }

        protected virtual Task OnBeforePushAsync(VectorStorePushContext context, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }

        protected abstract Task<int> UpsertBatchAsync(IReadOnlyList<RagChunk> batch, VectorStorePushContext context, CancellationToken cancellationToken);

        protected virtual Task OnAfterPushAsync(VectorStorePushContext context, int totalUpserted, CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
