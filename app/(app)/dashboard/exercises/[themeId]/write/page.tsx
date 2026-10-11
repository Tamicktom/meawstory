//* Libraries imports
import { notFound } from "next/navigation";
import { parseMarkdown } from '@tanstack/markdown/parser';
import { Markdown } from '@tanstack/markdown/react';

//* Services imports
import { findThemeById } from "@/services/theme";

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

  const thisTheme = await findThemeById(params.themeId);

  if (!thisTheme) {
    notFound();
  }

  const parsedDescription = parseMarkdown(thisTheme.description);

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