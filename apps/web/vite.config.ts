import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	base: "/the-orar/",
	plugins: [tailwindcss(), react()],
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
