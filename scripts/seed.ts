//* Libraries imports
import "dotenv/config"

//* Local imports
import { seedNarrativeCatalog } from "@/database/seed"

try {
  const result = await seedNarrativeCatalog()
  console.log(`Seeded ${result.rubrics} rubrics and ${result.themes} themes.`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
}
