//* Libraries imports
import {
  BookOpenIcon,
  FileTextIcon,
  HouseIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react"

export type MainNavigationItem = {
  id: "dashboard" | "themes" | "texts" | "account"
  title: string
  href: string
  icon: LucideIcon
}

//* Progress stays out of this cycle. These four destinations are the whole bar.
export const mainNavigation: readonly MainNavigationItem[] = [
  {
    id: "dashboard",
    title: "Início",
    href: "/dashboard",
    icon: HouseIcon,
  },
  {
    id: "themes",
    title: "Exercícios",
    href: "/dashboard/themes",
    icon: BookOpenIcon,
  },
  {
    id: "texts",
    title: "Minhas cenas",
    href: "/dashboard/texts",
    icon: FileTextIcon,
  },
  {
    id: "account",
    title: "Conta",
    href: "/dashboard/account",
    icon: UserRoundIcon,
  },
]
