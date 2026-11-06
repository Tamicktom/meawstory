"use client"

import { saveDisagreement } from "@/app/reading-feedback-actions"
import { useActionState, useState } from "react"
import type { Usefulness } from "@/services/reading-feedback"

async function sendOpinion(correctionId: string, body: object) {
  const response = await fetch(
    `/api/reading-feedback/${encodeURIComponent(correctionId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        "Sua sessão expirou. Entre novamente para registrar sua resposta."
      )
    throw new Error(
      "Não foi possível salvar. Tente novamente; sua resposta continua aqui."
    )
  }
}

export function UsefulnessQuestion({
  correctionId,
  initial,
}: {
  correctionId: string
  initial: Usefulness | null
}) {
  const [value, setValue] = useState(initial)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  async function choose(choice: Usefulness) {
    setPending(true)
    setError("")
    setMessage("")
    try {
      await sendOpinion(correctionId, { usefulness: choice })
      setValue(choice)
      setMessage("Resposta salva. Você pode mudar sua escolha.")
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setPending(false)
    }
  }
  return (
    <section
      className="space-y-3 rounded-lg border p-4"
      aria-label="Utilidade da leitura"
    >
      <h2 className="font-heading font-medium">Essa leitura ajudou?</h2>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["yes", "Sim"],
            ["partly", "Em parte"],
            ["no", "Não"],
          ] as const
        ).map(([choice, label]) => (
          <button
            key={choice}
            type="button"
            aria-pressed={value === choice}
            disabled={pending}
            onClick={() => choose(choice)}
            className="min-h-11 rounded-md border px-4 disabled:opacity-50 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {label}
          </button>
        ))}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {pending ? "Salvando resposta…" : message}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  )
}

export function CriterionDisagreement({
  correctionId,
  criterionId,
  initialReason,
}: {
  correctionId: string
  criterionId: string
  initialReason?: string
}) {
  const [state, submitAction, pending] = useActionState(saveDisagreement, {
    saved: initialReason !== undefined,
    reason: initialReason ?? "",
    message: "",
    error: "",
  })
  const [reason, setReason] = useState(state.reason)
  return (
    <details className="border-t pt-3">
      <summary className="w-fit cursor-pointer py-2 text-sm underline">
        Discordo deste critério{state.saved ? " — registrada" : ""}
      </summary>
      <form className="space-y-2" action={submitAction}>
        <input type="hidden" name="correctionId" value={correctionId} />
        <input type="hidden" name="criterionId" value={criterionId} />
        <label className="block text-sm">
          Motivo (opcional)
          <textarea
            name="reason"
            maxLength={2000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 min-h-24 w-full rounded-md border bg-background p-2"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Sua resposta ajuda a investigar a leitura. Ela não solicita revisão
          humana.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-md border px-3 disabled:opacity-50"
        >
          {pending
            ? "Salvando…"
            : state.saved
              ? "Atualizar discordância"
              : "Registrar discordância"}
        </button>
        <p role="status" className="text-sm">
          {state.message}
        </p>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
      </form>
    </details>
  )
}
