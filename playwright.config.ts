//* Libraries imports
import { defineConfig, devices } from "@playwright/test"

const isCI = Boolean(process.env.CI)

export default defineConfig({
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "e2e",
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "components",
      testDir: "./tests/components",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3100/playwright/gallery/index.html",
        serviceWorkers: "block",
        reuseContext: true,
      },
    },
  ],
  webServer: [
    {
      command: "bun run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: "bunx vite --config playwright/vite.config.ts",
      url: "http://localhost:3100/playwright/gallery/index.html",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
})
