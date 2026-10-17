import { env as workerEnv } from "cloudflare:workers";
import { z } from "zod";

/** Treat blank values as unset (common for placeholders in .dev.vars). */
const optionalString = z.preprocess(
	(v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
	z.string().min(1).optional(),
);

const serverEnvSchema = z.object({
	// ── Nicrron (OpenAI-compatible model gateway) ──
	NICRRON_API_KEY: optionalString,
	NICRRON_BASE_URL: z.string().url().default("https://api.nicrron.ai/v1"),
	/** Routing preset or concrete model, e.g. nicrron/auto, anthropic/claude-sonnet-5. */
	NICRRON_MODEL: z.string().min(1).default("nicrron/auto"),

	// ── PRISM tracing (disabled when the key is unset) ──
	PRISMTRACE_API_KEY: optionalString,
	PRISMTRACE_PROJECT_ID: optionalString,
	PRISMTRACE_HOST: z
		.string()
		.url()
		.default("https://api.prism.blockconvey.com"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validated server env. Reads Worker bindings (wrangler vars + secrets, or
 * .dev.vars locally). Server-only: never import from client components.
 */
export function getServerEnv(): ServerEnv {
	const result = serverEnvSchema.safeParse(workerEnv);
	if (!result.success) {
		const details = result.error.issues
			.map((i) => `  ${i.path.join(".")}: ${i.message}`)
			.join("\n");
		throw new Error(`Invalid server environment:\n${details}`);
	}
	return result.data;
}
