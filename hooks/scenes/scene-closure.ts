"use client"

//* Local imports
import { client } from "@/lib/eden"

import { settleSceneRequest } from "./scene-request"

export function closeScene(textId: string) {
  return settleSceneRequest(
    client.api.scenes({ textId }).close.post(),
    "Não foi possível encerrar a cena. Ela continua aberta."
  )
}

export function reopenScene(textId: string) {
  return settleSceneRequest(
    client.api.scenes({ textId }).reopen.post(),
    "Não foi possível reabrir a cena. Tente de novo."
  )
}
