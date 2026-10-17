import type OpenAI from "openai";
import { getServerEnv } from "./env.ts";
import { getNicrron } from "./nicrron.ts";
import { emitTraceSafe, type PrismConfig, type TraceMessage } from "./prism.ts";

export interface ChatMessage extends TraceMessage {
	role: "system" | "user" | "assistant";
}

export interface ChatRequest {
	messages: ChatMessage[];
	/** Overrides NICRRON_MODEL for this call. */
	model?: string;
	/** Ordered fallbacks Nicrron cascades to on 429/5xx from the primary. */
	models?: string[];
	temperature?: number;
	/** One per conversation; groups turns into a PRISM trajectory. */
	sessionId: string;
}

export interface ChatResponse {
	message: string;
	/** The model that actually answered (resolved when routing via nicrron/*). */
	model: string;
	sessionId: string;
}

/**
 * Single model turn through Nicrron, traced to PRISM. Every entry point that
 * calls a model should go through here (or emit its own trace).
 */
export async function chat(req: ChatRequest): Promise<ChatResponse> {
	const env = getServerEnv();
	const prism: PrismConfig | null =
		env.PRISMTRACE_API_KEY && env.PRISMTRACE_PROJECT_ID
			? {
					apiKey: env.PRISMTRACE_API_KEY,
					projectId: env.PRISMTRACE_PROJECT_ID,
					host: env.PRISMTRACE_HOST,
				}
			: null;

	const requestedModel = req.model ?? env.NICRRON_MODEL;
	const started = performance.now();
	try {
		const completion = await getNicrron(env).chat.completions.create({
			model: requestedModel,
			messages: req.messages,
			temperature: req.temperature,
			// Nicrron extension; not in the OpenAI types.
			...(req.models?.length ? { models: req.models } : {}),
		} as OpenAI.ChatCompletionCreateParamsNonStreaming);

		const message = completion.choices[0]?.message?.content ?? "";
		const model = completion.model || requestedModel;
		await emitTraceSafe(prism, {
			model,
			inputMessages: req.messages,
			outputMessage: message,
			latencyMs: performance.now() - started,
			sessionId: req.sessionId,
		});
		return { message, model, sessionId: req.sessionId };
	} catch (error) {
		// Failed turns are traced too, so errors and their latency show in PRISM.
		await emitTraceSafe(prism, {
			model: requestedModel,
			inputMessages: req.messages,
			outputMessage: `[error] ${error instanceof Error ? error.message : String(error)}`,
			latencyMs: performance.now() - started,
			sessionId: req.sessionId,
		});
		throw error;
	}
}
