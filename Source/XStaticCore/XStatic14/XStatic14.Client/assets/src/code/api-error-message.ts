/**
 * Gets a readable message from an error returned by `tryExecute`.
 *
 * xStatic endpoints that fail with an `XStaticResult` body (`{ wasSuccessful: false, message }`) end up as the
 * error's `problemDetails`, but Umbraco's default notification only reads `title` and `detail`, so the message
 * is lost. This checks for that message first, then the ProblemDetails fields, then the error's own message.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
	if (!error || typeof error !== 'object') {
		return fallback;
	}

	const details = (error as { problemDetails?: unknown }).problemDetails;

	if (details && typeof details === 'object') {
		const { message, detail, title } = details as { message?: unknown; detail?: unknown; title?: unknown };

		for (const candidate of [message, detail, title]) {
			if (typeof candidate === 'string' && candidate.trim()) {
				return candidate.trim();
			}
		}
	}

	const ownMessage = (error as { message?: unknown }).message;

	if (typeof ownMessage === 'string' && ownMessage.trim()) {
		return ownMessage.trim();
	}

	return fallback;
}
