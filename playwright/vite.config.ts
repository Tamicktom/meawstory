//* Libraries imports
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const rootDirectory = fileURLToPath(new URL("..", import.meta.url))
const nextNavigationMock = fileURLToPath(
  new URL("./mocks/next-navigation.ts", import.meta.url)
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // next/link reads process.env when the gallery renders a story.
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    "process.env.__NEXT_CACHE_COMPONENTS": "false",
    "process.env.__NEXT_LINK_NO_TOUCH_START": "false",
  },
  resolve: {
    alias: {
      "@": rootDirectory,
      "next/navigation": nextNavigationMock,
    },
  },
  server: {
    port: 3100,
    strictPort: true,
  },
})
