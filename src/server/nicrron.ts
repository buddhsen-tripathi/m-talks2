import OpenAI from "openai";
import type { ServerEnv } from "./env.ts";

let cached: { key: string; baseURL: string; client: OpenAI } | undefined;

/**
 * Nicrron is OpenAI-compatible: the stock `openai` SDK pointed at its base URL.
 * Reused per isolate so the connection pool isn't rebuilt per request.
 */
export function getNicrron(env: ServerEnv): OpenAI {
	if (!env.NICRRON_API_KEY) {
		throw new Error("NICRRON_API_KEY is not set (see .env.example)");
	}
	if (
		cached?.key !== env.NICRRON_API_KEY ||
		cached.baseURL !== env.NICRRON_BASE_URL
	) {
		cached = {
			key: env.NICRRON_API_KEY,
			baseURL: env.NICRRON_BASE_URL,
			client: new OpenAI({
				apiKey: env.NICRRON_API_KEY,
				baseURL: env.NICRRON_BASE_URL,
			}),
		};
	}
	return cached.client;
}
