//* How long "Cena excluída." stays on screen with Desfazer.
export const SCENE_UNDO_MS = 8_000

//* The server accepts a click that leaves the browser just as the notice closes.
export const SCENE_UNDO_SERVER_MS = 10_000

export function sceneUndoRemainingMs(deletedAt: Date, now = Date.now()) {
  return Math.max(0, SCENE_UNDO_MS - (now - deletedAt.getTime()))
}
