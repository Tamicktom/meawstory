//* Libraries imports
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDirectory = fileURLToPath(new URL("..", import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": rootDirectory,
    },
  },
  server: {
    port: 3100,
    strictPort: true,
  },
})
