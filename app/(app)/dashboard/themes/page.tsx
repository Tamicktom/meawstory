//* Libraries imports
import { db } from "@/database"


export default async function ThemesPage() {
  const themes = await db.query.theme.findMany({
    limit: 32,
  });

  return (
    <div>
      <h1>Themes</h1>
      <pre>
        {
          JSON.stringify(themes, null, 2)
        }
      </pre>
    </div>
  )
}