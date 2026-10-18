//* Libraries imports
import { notFound } from "next/navigation";
import Link from "next/link";
import { parseMarkdown } from '@tanstack/markdown/parser';
import { Markdown } from '@tanstack/markdown/react';

//* Services imports
import { themeService } from "@/services/theme";

//* Style imports
import { buttonVariants } from "@/components/ui/button/button-variants";


type WritePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WritePage(props: WritePageProps) {
  const params = await props.params;

  const thisTheme = await themeService.findThemeById(params.id);

  if (!thisTheme) {
    notFound();
  }

  const parsedDescription = parseMarkdown(thisTheme.description);

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