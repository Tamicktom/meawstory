//* Libraries imports
import Link from "next/link";

//* Local imports
import { db } from "@/database";

//* Components imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ThemeCardTheme = {
  id: string;
  title: string;
  description: string;
  image: string | null;
};

type ThemeCardProps = {
  theme: ThemeCardTheme;
};

function themeExcerpt(description: string): string {
  const situation = description.match(/## Situação\s+([\s\S]*?)(?:\n## |$)/);
  const excerpt = situation?.[1]?.trim();

  if (!excerpt) {
    return description.trim();
  }

  return excerpt;
}

function ThemeCard(props: ThemeCardProps) {
  return (
    <Link
      href={`/dashboard/themes/${props.theme.id}`}
      className="block h-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:bg-accent">
        {props.theme.image ? (
          <img src={props.theme.image} alt="" className="aspect-video w-full object-cover" />
        ) : null}
        <CardHeader>
          <CardTitle>{props.theme.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-4 text-muted-foreground">
            {themeExcerpt(props.theme.description)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function ThemesPage() {
  const themes = await db.query.theme.findMany({
    columns: {
      id: true,
      title: true,
      description: true,
      image: true,
    },
    where: {
      deletedAt: {
        isNull: true,
      },
    },
    orderBy: {
      title: "asc",
    },
    limit: 32,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Themes</h1>
      {themes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No themes yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <li key={theme.id} className="min-w-0">
              <ThemeCard theme={theme} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
