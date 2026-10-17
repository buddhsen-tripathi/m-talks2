import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { chat } from "#/server/chat.ts";

const bodySchema = z.object({
	messages: z
		.array(
			z.object({
				role: z.enum(["system", "user", "assistant"]),
				content: z.string(),
			}),
		)
		.min(1),
	model: z.string().min(1).optional(),
	models: z.array(z.string().min(1)).optional(),
	temperature: z.number().min(0).max(2).optional(),
	sessionId: z.string().min(1).max(200).optional(),
});

export const Route = createFileRoute("/api/chat")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const parsed = bodySchema.safeParse(
					await request.json().catch(() => null),
				);
				if (!parsed.success) {
					return Response.json(
						{ error: "Invalid request", issues: parsed.error.issues },
						{ status: 400 },
					);
				}
				const { sessionId = crypto.randomUUID(), ...rest } = parsed.data;
				try {
					return Response.json(await chat({ ...rest, sessionId }));
				} catch (error) {
					console.error("[api/chat]", error);
					return Response.json(
						{ error: "Model request failed", sessionId },
						{ status: 502 },
					);
				}
			},
		},
	},
});
