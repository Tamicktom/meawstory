//* Libraries imports
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import pg from "pg"

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "migrations"
)

export function assertDevDatabaseUrl(
  databaseUrl: string | undefined,
): URL {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required to reset the development database."
    )
  }

  let url: URL
  try {
    url = new URL(databaseUrl)
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.")
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("migrate:fresh only supports PostgreSQL.")
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ""))
  if (databaseName.length === 0) {
    throw new Error("DATABASE_URL must include a database name.")
  }

  return url
}

export async function resetDevDatabase(options: {
  databaseUrl: string | undefined
}): Promise<void> {
  const databaseUrl = assertDevDatabaseUrl(options.databaseUrl)
  const client = new pg.Client({ connectionString: databaseUrl.href })
  await client.connect()

  try {
    const schemas = await client.query<{ nspname: string }>(`
      SELECT nspname
      FROM pg_namespace
      WHERE nspname <> 'information_schema'
        AND nspname NOT LIKE 'pg\\_%'
    `)

    await client.query("BEGIN")
    try {
      for (const schema of schemas.rows) {
        await client.query(
          `DROP SCHEMA ${quoteIdentifier(schema.nspname)} CASCADE`
        )
      }
      await client.query("CREATE SCHEMA public")
      await client.query("GRANT ALL ON SCHEMA public TO public")
      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }
  } finally {
    await client.end()
  }

  const pool = new pg.Pool({ connectionString: databaseUrl.href })
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder })
  } finally {
    await pool.end()
  }
}

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(
      `Refusing to drop schema "${identifier}" because its name is not a plain identifier.`
    )
  }

  return `"${identifier}"`
}
