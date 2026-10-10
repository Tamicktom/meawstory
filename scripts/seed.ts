//* Libraries imports
import "dotenv/config"

//* Local imports
import { seedNarrativeCatalog, seedTestUser } from "@/database/seed"

try {
  const catalog = await seedNarrativeCatalog()
  const testUser = await seedTestUser()
  const testUserAction = testUser.created ? "Created" : "Updated"

  console.log(
    `Seeded ${catalog.rubrics} rubrics and ${catalog.themes} themes.`
  )
  console.log(`${testUserAction} test user ${testUser.email}.`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
