//* Libraries imports
import Link from "next/link"

//* Components imports
import { buttonVariants } from "@/components/ui/button/button-variants"

export default function DashboardPage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 p-4">
      <h1 className="font-heading text-lg font-medium">Dashboard</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        Start by choosing a theme. Write a text for it and receive a correction
        against that theme&apos;s rubric.
      </p>
      <Link
        id="dashboard-browse-themes"
        href="/dashboard/themes"
        className={buttonVariants({ className: "w-fit" })}
      >
        Browse themes
      </Link>
    </div>
  )
}
