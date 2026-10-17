/**
 * PRISM trace ingest over HTTP (no SDK for TypeScript). One trace per model
 * turn; `sessionId` groups turns into a trajectory, so pass one value per
 * conversation or agent run.
 */

export interface PrismConfig {
	apiKey: string;
	projectId: string;
	host: string;
}

export interface TraceMessage {
	role: string;
	content: string;
}

export interface PrismTrace {
	model: string;
	inputMessages: TraceMessage[];
	outputMessage: string;
	latencyMs: number;
	sessionId: string;
}

export async function emitTrace(
	config: PrismConfig,
	trace: PrismTrace,
	fetchImpl: typeof fetch = fetch,
): Promise<void> {
	const res = await fetchImpl(`${config.host}/api/traces`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			// PRISM API keys use this header, not `Authorization: Bearer`.
			"X-PRISMtrace-Key": config.apiKey,
		},
		body: JSON.stringify({
			project_id: config.projectId,
			model: trace.model,
			input_messages: trace.inputMessages,
			output_message: trace.outputMessage,
			latency_ms: Math.round(trace.latencyMs),
			session_id: trace.sessionId,
		}),
	});
	if (!res.ok) {
		throw new Error(`PRISM ingest ${res.status}: ${await res.text()}`);
	}
}

/**
 * Best-effort variant for request paths: tracing must never fail the user's
 * request. Awaited by callers so a Worker isn't frozen mid-POST.
 */
export async function emitTraceSafe(
	config: PrismConfig | null,
	trace: PrismTrace,
): Promise<void> {
	if (!config) return;
	try {
		await emitTrace(config, trace);
	} catch (error) {
		console.error(
			`[prism] ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
