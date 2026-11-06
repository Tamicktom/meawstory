import type { DisagreementState } from "@/app/reading-feedback-actions"

// The Vite gallery has no Server Actions runtime. Exercise the same form state
// through its intercepted API; the real action is covered by unit and E2E tests.
export async function saveDisagreement(
  previous: DisagreementState,
  formData: FormData
): Promise<DisagreementState> {
  const reason = String(formData.get("reason") ?? "")
  const state = { ...previous, reason, message: "", error: "" }
  const response = await fetch(
    `/api/reading-feedback/${formData.get("correctionId")}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        criterionId: formData.get("criterionId"),
        reason,
      }),
    }
  )
  if (!response.ok)
    return {
      ...state,
      error:
        response.status === 401
          ? "Sua sessão expirou. Entre novamente para registrar sua resposta."
          : "Não foi possível salvar. Tente novamente; sua resposta continua aqui.",
    }
  return {
    ...state,
    saved: true,
    message: "Discordância registrada. A avaliação permanece igual.",
  }
}
