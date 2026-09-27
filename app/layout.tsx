import { Geist, Geist_Mono, Outfit, Roboto_Slab } from "next/font/google";

// * Providers imports
import { ThemeProvider } from "@/components/theme-provider"

//* Utils imports
import { cn } from "@/lib/utils";

//* Styles imports
import "./globals.css";

//* Fonts
const robotoSlabHeading = Roboto_Slab({ subsets: ['latin'], variable: '--font-heading' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable, robotoSlabHeading.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
