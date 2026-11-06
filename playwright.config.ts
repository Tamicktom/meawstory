//* Libraries imports
import { defineConfig, devices } from "@playwright/test"

const isCI = Boolean(process.env.CI)

export default defineConfig({
  globalSetup: "./tests/e2e-global-setup.ts",
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
      command: "bun run build && bun run start",
      env: { MEAWSTORY_E2E: "1" },
      stdout: "pipe",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: "bunx vite --config playwright/vite.config.ts",
      url: "http://localhost:3100/playwright/gallery/index.html",
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
})
