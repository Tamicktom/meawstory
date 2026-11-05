//* Libraries imports
import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

//* Local imports
import { authHref, requestedPathHeader } from "@/lib/auth-destination"

//* The cookie check is optimistic. requireSession makes the real check, against the database.
export function proxy(request: NextRequest) {
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(
      new URL(authHref("/sign-in", requestedPath), request.url)
    )
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(requestedPathHeader, requestedPath)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: "/dashboard/:path*",
}
