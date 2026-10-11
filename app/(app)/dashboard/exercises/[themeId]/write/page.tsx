//* Libraries imports
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { parseMarkdown } from '@tanstack/markdown/parser';
import { Markdown } from '@tanstack/markdown/react';

//* Local imports
import { db } from "@/database";
import { theme } from "@/database/schema";

//* Style imports
import { buttonVariants } from "@/components/ui/button";

//* Component imports
import { Editor } from "./_components/editor";


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

  const parsedDescription = parseMarkdown(thisTheme[0].description);

  return (
    <div className="flex-row justify-center items-start gap-2 w-full grid grid-cols-3">
      <div className="prose dark:prose-invert col-span-1">
        <Markdown>
          {parsedDescription}
        </Markdown>
      </div>

      <Editor themeId={params.themeId} />

    </div>
  );
}