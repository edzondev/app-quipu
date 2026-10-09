import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

const CONVEX_TESTS = "convex/**/*.convex.test.ts";

export default defineConfig({
	plugins: [react()],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: "jsdom",
					environment: "jsdom",
					exclude: [...configDefaults.exclude, CONVEX_TESTS],
				},
			},
			{
				// Real Convex functions and validators over convex-test, in the Convex runtime.
				extends: true,
				test: {
					name: "convex",
					environment: "edge-runtime",
					include: [CONVEX_TESTS],
					server: { deps: { inline: ["convex-test"] } },
				},
			},
		],
	},
});
