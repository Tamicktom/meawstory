//* Libraries imports
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

//* Local imports
import { db } from "@/database";
import { theme } from "@/database/schema";


type WritePageProps = {
  params: Promise<{
    themeId: string;
  }>;
};

export default async function WritePage(props: WritePageProps) {
  const params = await props.params;

  const thisTheme = await db
    .select()
    .from(theme)
    .where(eq(theme.id, params.themeId))
    .limit(1);

  if (thisTheme.length === 0) {
    notFound();
  }

  return (
    <div>
      <h1>Write Page</h1>
      <p>Theme ID: {params.themeId}</p>
      <pre>
        {
          JSON.stringify(thisTheme, null, 2)
        }
      </pre>
    </div>
  );
}