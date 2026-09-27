"use client"

//* Libraries imports
import * as React from "react"

//* Components imports
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // next-themes injects a blocking script so the theme is applied before paint.
  // React 19 refuses to execute <script> tags rendered by client components and
  // logs an error when it sees one. The server copy stays executable; the client
  // copy is a data block so the warning does not fire and hydration can match.
  const scriptProps: NonNullable<typeof props.scriptProps> = {
    ...props.scriptProps,
    type: typeof window === "undefined" ? props.scriptProps?.type : "application/json",
  };

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
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
};

function isModKey(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function ThemeHotkey() {
  const theme = useTheme();

  React.useEffect(() => {
    //* Event listener function
    function onKeyDown(event: KeyboardEvent) {
      const canToggle =
        !event.defaultPrevented &&
        !event.repeat &&
        event.key.toLowerCase() === "d" &&
        !isModKey(event) &&
        !isTypingTarget(event.target)

      if (!canToggle) return;

      theme.setTheme(theme.resolvedTheme === "dark" ? "light" : "dark")
    };

    window.addEventListener("keydown", onKeyDown);

    //* Cleanup function
    return () => { window.removeEventListener("keydown", onKeyDown) };
  }, [theme.resolvedTheme, theme.setTheme]);

  return null;
}

export { ThemeProvider };
