//* Components imports
import { DeleteSceneButton } from "./delete-scene-button"
import { DeletedSceneNotice } from "./deleted-scene-notice"

export function Button(props: { redirectTo?: string }) {
  return (
    <DeleteSceneButton
      id="delete-scene"
      textId="text-1"
      redirectTo={props.redirectTo}
    />
  )
}

export function Notice() {
  return (
    <DeletedSceneNotice
      textId="text-1"
      title="A chave na mesa"
      deletedAt={new Date().toISOString()}
      readingInProgress={false}
    />
  )
}

export function NoticeWhileReading() {
  return (
    <DeletedSceneNotice
      textId="text-1"
      title="A chave na mesa"
      deletedAt={new Date().toISOString()}
      readingInProgress
    />
  )
}

export function ExpiredNotice() {
  return (
    <DeletedSceneNotice
      textId="text-1"
      title="A chave na mesa"
      deletedAt={new Date(Date.now() - 9_000).toISOString()}
      readingInProgress={false}
    />
  )
}
