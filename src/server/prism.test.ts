import { describe, expect, it, vi } from "vitest";
import { emitTrace, emitTraceSafe } from "./prism.ts";

const config = {
	apiKey: "pt-sk-test",
	projectId: "project-1",
	host: "https://prism.example",
};
const trace = {
	model: "nicrron/auto",
	inputMessages: [{ role: "user", content: "hello" }],
	outputMessage: "hi",
	latencyMs: 119.6,
	sessionId: "session-1",
};

describe("emitTrace", () => {
	it("posts the ingest payload with the PRISM key header", async () => {
		const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
		await emitTrace(config, trace, fetchImpl);

		const [url, init] = fetchImpl.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://prism.example/api/traces");
		expect(new Headers(init.headers).get("X-PRISMtrace-Key")).toBe(
			"pt-sk-test",
		);
		expect(JSON.parse(init.body as string)).toEqual({
			project_id: "project-1",
			model: "nicrron/auto",
			input_messages: [{ role: "user", content: "hello" }],
			output_message: "hi",
			latency_ms: 120,
			session_id: "session-1",
		});
	});

	it("throws with the response body on non-2xx", async () => {
		const fetchImpl = vi.fn(async () => new Response("nope", { status: 403 }));
		await expect(emitTrace(config, trace, fetchImpl)).rejects.toThrow(
			"PRISM ingest 403: nope",
		);
	});
});

describe("emitTraceSafe", () => {
	it("is a no-op when tracing is not configured", async () => {
		await expect(emitTraceSafe(null, trace)).resolves.toBeUndefined();
	});
});
