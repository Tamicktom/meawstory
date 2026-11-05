const defaultDestination = "/dashboard"
const placeholderOrigin = "http://meawstory.invalid"

//* The proxy sets this header, so a page can send an expired session back to where it was.
const requestedPathHeader = "x-meawstory-requested-path"

function isProtectedPath(pathname: string) {
  return pathname === defaultDestination || pathname.startsWith(`${defaultDestination}/`)
}

//* The value comes from the URL. Parsing resolves "/\evil.com", "//evil.com" and "/dashboard/../api".
function safeDestination(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return defaultDestination
  }

  let url: URL

  try {
    url = new URL(value, placeholderOrigin)
  } catch {
    return defaultDestination
  }

  if (url.origin !== placeholderOrigin || !isProtectedPath(url.pathname)) {
    return defaultDestination
  }

  return `${url.pathname}${url.search}${url.hash}`
}

function authHref(path: "/sign-in" | "/sign-up", destination: unknown): string {
  const safe = safeDestination(destination)

  if (safe === defaultDestination) {
    return path
  }

  return `${path}?next=${encodeURIComponent(safe)}`
}

export { authHref, defaultDestination, requestedPathHeader, safeDestination }
