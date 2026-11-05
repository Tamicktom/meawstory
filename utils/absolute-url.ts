//* Vercel sets NEXT_PUBLIC_VERCEL_URL to a bare host, and Better Auth rejects a base URL with no protocol.
export function toAbsoluteUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}
