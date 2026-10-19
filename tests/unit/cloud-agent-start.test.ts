//* Libraries imports
import { describe, expect, it } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

const scriptPath = path.resolve("scripts/cloud-agent-start.sh")
const exampleEnv = [
  "NEXT_PUBLIC_VERCEL_URL=http://localhost:3000",
  "BETTER_AUTH_SECRET=",
  "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres",
  "OPENAI_API_KEY=sk-proj-...",
  "",
].join("\n")
const serverEnvWithOpenAI = [
  "export const serverEnv = {",
  "  server: {",
  "    OPENAI_API_KEY: z.string(),",
  "  },",
  "}",
  "",
].join("\n")
const serverEnvWithoutOpenAI = [
  "export const serverEnv = {",
  "  server: {",
  "    DATABASE_URL: z.string(),",
  "  },",
  "}",
  "",
].join("\n")

function childEnv(overrides: Record<string, string | undefined>) {
  const env: Record<string, string> = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value
    }
  }

  delete env.OPENAI_API_KEY

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key]
      continue
    }

    env[key] = value
  }

  return env
}

async function createWorkspace(serverEnvSource: string) {
  const workspace = await mkdtemp(path.join(tmpdir(), "cloud-agent-start-"))
  await writeFile(path.join(workspace, "example.env"), exampleEnv)
  await mkdir(path.join(workspace, "env"))
  await writeFile(path.join(workspace, "env", "server.ts"), serverEnvSource)

  return workspace
}

async function runStart(
  workspace: string,
  overrides: Record<string, string | undefined>
) {
  const proc = Bun.spawn(["bash", scriptPath], {
    cwd: workspace,
    env: childEnv({
      CLOUD_AGENT_WORKSPACE: workspace,
      CLOUD_AGENT_SKIP_BOOTSTRAP: "1",
      ...overrides,
    }),
    stdout: "pipe",
    stderr: "pipe",
  })
  const stdout = await new Response(proc.stdout).text()
  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited

  return { exitCode, stdout, stderr }
}

describe("cloud agent start", () => {
  describe("environment file", () => {
    it("writes OPENAI_API_KEY from the environment and generates BETTER_AUTH_SECRET", async () => {
      const workspace = await createWorkspace(serverEnvWithOpenAI)

      try {
        const result = await runStart(workspace, {
          OPENAI_API_KEY: "sk-test-cloud-agent",
        })
        const envFile = await readFile(path.join(workspace, ".env"), "utf8")

        expect(result.exitCode).toBe(0)
        expect(envFile).toContain("OPENAI_API_KEY=sk-test-cloud-agent")
        expect(envFile).not.toContain("OPENAI_API_KEY=sk-proj-...")
        expect(envFile).toMatch(/^BETTER_AUTH_SECRET=[0-9a-f]{64}$/m)
      } finally {
        await rm(workspace, { recursive: true, force: true })
      }
    })

    it("keeps an existing BETTER_AUTH_SECRET", async () => {
      const workspace = await createWorkspace(serverEnvWithOpenAI)
      await writeFile(
        path.join(workspace, ".env"),
        "BETTER_AUTH_SECRET=already-set\nOPENAI_API_KEY=sk-proj-...\n"
      )

      try {
        const result = await runStart(workspace, {
          OPENAI_API_KEY: "sk-test-cloud-agent",
        })
        const envFile = await readFile(path.join(workspace, ".env"), "utf8")

        expect(result.exitCode).toBe(0)
        expect(envFile).toContain("BETTER_AUTH_SECRET=already-set")
        expect(envFile).toContain("OPENAI_API_KEY=sk-test-cloud-agent")
      } finally {
        await rm(workspace, { recursive: true, force: true })
      }
    })

    it("exits when OPENAI_API_KEY is required and missing", async () => {
      const workspace = await createWorkspace(serverEnvWithOpenAI)

      try {
        const result = await runStart(workspace, {})

        expect(result.exitCode).not.toBe(0)
        expect(result.stderr).toContain("OPENAI_API_KEY")
      } finally {
        await rm(workspace, { recursive: true, force: true })
      }
    })

    it("skips OpenAI when the server schema does not declare it", async () => {
      const workspace = await createWorkspace(serverEnvWithoutOpenAI)

      try {
        const result = await runStart(workspace, {})
        const envFile = await readFile(path.join(workspace, ".env"), "utf8")

        expect(result.exitCode).toBe(0)
        expect(result.stderr).not.toContain("OPENAI_API_KEY is required")
        expect(envFile).toContain("OPENAI_API_KEY=sk-proj-...")
        expect(envFile).toMatch(/^BETTER_AUTH_SECRET=[0-9a-f]{64}$/m)
      } finally {
        await rm(workspace, { recursive: true, force: true })
      }
    })
  })
})
