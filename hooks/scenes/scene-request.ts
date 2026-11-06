function errorMessage(value: unknown) {
  if (!value || typeof value !== "object" || !("message" in value)) return null
  const message = value.message
  return typeof message === "string" ? message : null
}

export async function settleSceneRequest(
  request: Promise<{
    error: { value: unknown } | null
    status: number
  }>,
  fallback: string
) {
  const response = await request.catch(() => {
    throw new Error(fallback)
  })
  if (!response.error) return
  const message = errorMessage(response.error.value)
  throw new Error(response.status < 500 && message ? message : fallback)
}
