//* Libraries imports
import "dotenv/config"

//* Local imports
import {
  assertDevDatabaseUrl,
  resetDevDatabase,
} from "@/database/reset-dev-database"

try {
  const databaseUrl = assertDevDatabaseUrl(
    process.env.DATABASE_URL,
  )
  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\//, "")
  )

  console.log(
    `Resetting development database "${databaseName}" on ${databaseUrl.hostname}.`
  )
  await resetDevDatabase({
    databaseUrl: process.env.DATABASE_URL,
  })
  console.log("Development database reset and migrations applied.")
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
