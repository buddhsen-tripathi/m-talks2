# m-talks2

See README.md for stack, layout, scripts and theming rules.

- Model calls go through Nicrron (`src/server/nicrron.ts`, OpenAI-compatible). Server-only.
- Server env is read via `getServerEnv()` in `src/server/env.ts` (Worker bindings / `.dev.vars`).
- Components use semantic color tokens from `src/styles.css` only, never raw palette classes.

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at: `src/server/prism.ts` (HTTP ingest client), `src/server/chat.ts` (Nicrron chat turn, traced on success and error), `src/routes/api/chat.ts` (POST /api/chat entry point, assigns `sessionId`), `src/server/env.ts` (PRISM env vars)

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it.
