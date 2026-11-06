//* Components imports
import { CloseSceneButton } from "@/components/scenes/close-scene-button"
import { DeleteSceneButton } from "@/components/scenes/delete-scene-button"

export function ReadingSceneActions(props: {
  textId?: string
  closed?: boolean
}) {
  return props.textId ? (
    <div className="flex min-w-0 flex-col gap-2">
      <CloseSceneButton
        id={props.closed ? "reopen-scene" : "close-scene"}
        textId={props.textId}
        closed={Boolean(props.closed)}
      />
      <DeleteSceneButton
        id="delete-scene"
        textId={props.textId}
        redirectTo="/dashboard/texts"
      />
    </div>
  ) : null
}
