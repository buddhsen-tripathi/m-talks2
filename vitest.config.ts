import { resolve } from "node:path";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [viteReact()],
	resolve: {
		alias: { "#": resolve(__dirname, "./src") },
	},
	test: {
		// Component tests opt into jsdom with a per-file `@vitest-environment` docblock.
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
		passWithNoTests: true,
	},
});
