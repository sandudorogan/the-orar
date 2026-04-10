import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
	resolve: {
		alias: {
			"@orar/domain": resolve(__dirname, "packages/domain/src/index.ts"),
			"@orar/solver": resolve(__dirname, "packages/solver/src/index.ts"),
			"@orar/exports": resolve(__dirname, "packages/exports/src/index.ts"),
			"@orar/locales": resolve(__dirname, "packages/locales/src/index.ts"),
		},
	},
	test: {
		include: ["packages/*/src/**/*.test.ts", "apps/*/src/**/*.test.{ts,tsx}", "tests/**/*.test.ts"],
		environment: "node",
		globals: true,
	},
})
