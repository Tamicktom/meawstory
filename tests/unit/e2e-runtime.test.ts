import { afterEach, expect, test } from "bun:test"
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { savedCorrection } from "../helpers/saved-correction"

const temporaryDirectories: string[] = []
const projectRoot = path.resolve(import.meta.dir, "../..")

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

async function runProduction(code: string, e2e: boolean, fixture = false) {
  const directory = await mkdtemp(path.join(tmpdir(), "meawstory-e2e-"))
  temporaryDirectories.push(directory)
  if (fixture) {
    await mkdir(path.join(directory, "tests/helpers"), { recursive: true })
    await writeFile(
      path.join(directory, "tests/helpers/.saved-correction.json"),
      JSON.stringify(savedCorrection)
    )
  }
  const child = Bun.spawn([process.execPath, "--eval", code], {
    cwd: directory,
    env: {
      ...process.env,
      NODE_ENV: "production",
      MEAWSTORY_E2E: e2e ? "1" : "",
      RESEND_API_KEY: "",
    },
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  return { stdout, stderr, exitCode }
}

const correctionModule = JSON.stringify(
  path.join(projectRoot, "workflows/correction-stand-in.ts")
)
const emailModule = JSON.stringify(path.join(projectRoot, "services/email.ts"))

test("a production E2E run uses the fixture and fails closed when it is missing", async () => {
  const code = `import { readSavedCorrection } from ${correctionModule}; console.log(readSavedCorrection()?.opening)`
  const present = await runProduction(code, true, true)
  expect(present.exitCode).toBe(0)
  expect(present.stdout).toContain(savedCorrection.opening)
  const missing = await runProduction(code, true)
  expect(missing.exitCode).not.toBe(0)
  expect(missing.stderr).toContain(
    "Saved correction stand-in is missing in E2E mode."
  )
})

test("production without the E2E flag ignores a saved fixture", async () => {
  const result = await runProduction(
    `import { readSavedCorrection } from ${correctionModule}; console.log(readSavedCorrection())`,
    false,
    true
  )
  expect(result.exitCode).toBe(0)
  expect(result.stdout.trim()).toBe("null")
})

test("a production E2E run writes email locally without a Resend key or network call", async () => {
  const result = await runProduction(
    `
    import { sendEmail, emailOutboxPath } from ${emailModule};
    import { readdir, readFile } from "node:fs/promises";
    import path from "node:path";
    globalThis.fetch = () => { throw new Error("Unexpected network call") };
    await sendEmail({ to: "e2e@example.com", subject: "E2E", html: "<p>E2E</p>", text: "E2E" });
    const [file] = await readdir(emailOutboxPath());
    console.log(JSON.parse(await readFile(path.join(emailOutboxPath(), file), "utf8")).to);
  `,
    true
  )
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("e2e@example.com")
})
