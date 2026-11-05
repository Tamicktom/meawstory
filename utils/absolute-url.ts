//* Vercel sets NEXT_PUBLIC_VERCEL_URL to the deployment host, without a protocol.
//* Better Auth rejects a base URL with no protocol, and that host is not the public site.
export const productionSiteUrl = "https://meawstory.com"

export function toAbsoluteUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}

//* Production emails, callbacks, and the trusted origin must use the public site.
//* Preview and local runs keep the configured host.
export function publicBaseUrl(vercelEnv: string | undefined, configuredUrl: string): string {
  if (vercelEnv === "production") return productionSiteUrl
  return toAbsoluteUrl(configuredUrl)
}
