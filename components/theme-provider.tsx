"use client"

//* Libraries imports
import * as React from "react"

//* Components imports
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  };

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function ThemeHotkey() {
  const theme = useTheme();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const canToggle =
        !event.defaultPrevented &&
        !event.repeat &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        event.key.toLowerCase() === "d" &&
        !isTypingTarget(event.target)

      if (!canToggle) return;

      theme.setTheme(theme.resolvedTheme === "dark" ? "light" : "dark")
    };

    window.addEventListener("keydown", onKeyDown);

    return () => { window.removeEventListener("keydown", onKeyDown) };
  }, [theme.resolvedTheme, theme.setTheme]);

  return null;
}

export { ThemeProvider };
