//* Libraries imports
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { parseMarkdown } from '@tanstack/markdown/parser';
import { Markdown } from '@tanstack/markdown/react';

//* Local imports
import { db } from "@/database";
import { theme } from "@/database/schema";

//* Style imports
import { buttonVariants } from "@/components/ui/button";


type WritePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WritePage(props: WritePageProps) {
  const params = await props.params;

  const thisTheme = await db
    .select()
    .from(theme)
    .where(eq(theme.id, params.id))
    .limit(1);

  if (thisTheme.length === 0) {
    notFound();
  }

  const parsedDescription = parseMarkdown(thisTheme[0].description);

  return (
    <div>
      <h1>Theme Page</h1>
      <p>Theme ID: {params.id}</p>

      <div className="prose dark:prose-invert">
        <Markdown>
          {parsedDescription}
        </Markdown>
      </div>

      <Link
        href={`/dashboard/exercises/${params.id}/write`}
        className={buttonVariants({ size: "lg" })}
      >
        Escrever exercício
      </Link>
    </div>
  );
}