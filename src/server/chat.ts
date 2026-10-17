import type OpenAI from "openai";
import { getServerEnv } from "./env.ts";
import { getNicrron } from "./nicrron.ts";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface ChatRequest {
	messages: ChatMessage[];
	/** Overrides NICRRON_MODEL for this call. */
	model?: string;
	/** Ordered fallbacks Nicrron cascades to on 429/5xx from the primary. */
	models?: string[];
	temperature?: number;
	/** One per conversation. */
	sessionId: string;
}

export interface ChatResponse {
	message: string;
	/** The model that actually answered (resolved when routing via nicrron/*). */
	model: string;
	sessionId: string;
}

/**
 * Single model turn through Nicrron.
 */
export async function chat(req: ChatRequest): Promise<ChatResponse> {
	const env = getServerEnv();
	const requestedModel = req.model ?? env.NICRRON_MODEL;
	const completion = await getNicrron(env).chat.completions.create({
		model: requestedModel,
		messages: req.messages,
		temperature: req.temperature,
		// Nicrron extension; not in the OpenAI types.
		...(req.models?.length ? { models: req.models } : {}),
	} as OpenAI.ChatCompletionCreateParamsNonStreaming);

	const message = completion.choices[0]?.message?.content ?? "";
	const model = completion.model || requestedModel;
	return { message, model, sessionId: req.sessionId };
}
