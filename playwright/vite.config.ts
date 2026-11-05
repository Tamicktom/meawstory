//* Libraries imports
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const rootDirectory = fileURLToPath(new URL("..", import.meta.url))
const nextNavigationMock = fileURLToPath(
  new URL("./mocks/next-navigation.ts", import.meta.url)
)
const env = loadEnv(process.env.NODE_ENV ?? "development", rootDirectory, "")

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // next/link reads process.env when the gallery renders a story.
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    "process.env.NEXT_PUBLIC_VERCEL_URL": JSON.stringify(
      env.NEXT_PUBLIC_VERCEL_URL ?? "http://localhost:3000"
    ),
    "process.env.__NEXT_CACHE_COMPONENTS": "false",
    "process.env.__NEXT_LINK_NO_TOUCH_START": "false",
  },
  resolve: {
    alias: {
      "@": rootDirectory,
      "next/navigation": nextNavigationMock,
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "@tiptap/react",
      "@tiptap/starter-kit",
    ],
  },
  server: {
    port: 3100,
    strictPort: true,
  },
})
