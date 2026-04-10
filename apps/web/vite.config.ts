import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	build: {
		target: "esnext",
		rollupOptions: {
			output: {
				manualChunks: {
					react: ["react", "react-dom"],
				},
			},
		},
	},
})
