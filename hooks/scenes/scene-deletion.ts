"use client"

//* Local imports
import { client } from "@/lib/eden"

import { settleSceneRequest } from "./scene-request"

export function retireScene(textId: string) {
  return settleSceneRequest(
    client.api.scenes({ textId }).retire.post(),
    "Não foi possível excluir a cena. Ela continua em Minhas cenas."
  )
}

export function restoreScene(textId: string) {
  return settleSceneRequest(
    client.api.scenes({ textId }).restore.post(),
    "Não foi possível desfazer a exclusão. Tente de novo."
  )
}
