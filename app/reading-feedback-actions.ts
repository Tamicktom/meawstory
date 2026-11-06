"use server"

import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { saveReadingFeedback } from "@/services/reading-feedback"

export type DisagreementState = {
  saved: boolean
  reason: string
  message: string
  error: string
}

const disagreementSchema = z.strictObject({
  correctionId: z.string().min(1),
  criterionId: z.string().min(1),
  reason: z.string().trim().max(2000),
})

export async function saveDisagreement(
  previous: DisagreementState,
  formData: FormData
): Promise<DisagreementState> {
  const submittedReason = formData.get("reason")
  const state = {
    ...previous,
    reason: typeof submittedReason === "string" ? submittedReason : "",
    message: "",
    error: "",
  }
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session)
    return {
      ...state,
      error: "Sua sessão expirou. Entre novamente para registrar sua resposta.",
    }
  const parsed = disagreementSchema.safeParse({
    correctionId: formData.get("correctionId"),
    criterionId: formData.get("criterionId"),
    reason: submittedReason ?? "",
  })
  if (!parsed.success)
    return {
      ...state,
      error: "Confira o critério e use até 2.000 caracteres no motivo.",
    }
  const { correctionId, criterionId, reason } = parsed.data
  try {
    const saved = await saveReadingFeedback(session.user.id, correctionId, {
      criterionId,
      reason,
    })
    if (!saved)
      return {
        ...state,
        error: "Esta leitura ou critério não está disponível para sua conta.",
      }
    return {
      ...state,
      saved: true,
      message: "Discordância registrada. A avaliação permanece igual.",
    }
  } catch {
    // Database errors may include the submitted reason; never return or log them.
    return {
      ...state,
      error:
        "Não foi possível salvar. Tente novamente; sua resposta continua aqui.",
    }
  }
}
