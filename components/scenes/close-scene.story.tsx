//* Components imports
import { CloseSceneButton } from "./close-scene-button"

export function Open() {
  return <CloseSceneButton id="close-scene" textId="text-1" closed={false} />
}

export function Closed() {
  return <CloseSceneButton id="reopen-scene" textId="text-1" closed />
}
