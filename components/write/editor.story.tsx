//* Libraries imports
import { useEffect } from "react"

//* Components imports
import { Editor } from "@/app/(app)/dashboard/exercises/[themeId]/write/_components/editor"

//* Local imports
import { queryClient } from "@/utils/query-client"

type EditorStoryProps = {
  themeId?: string
}

export function Default(props: EditorStoryProps) {
  useEffect(() => {
    queryClient.clear()
  }, [])

  return <Editor themeId={props.themeId ?? "theme-1"} />
}

export function Revision() {
  useEffect(() => {
    queryClient.clear()
  }, [])

  return (
    <Editor
      themeId="theme-1"
      textId="scene-1"
      initialContent="A chave ficou na mesa entre as duas."
      revision={{
        version: 2,
        focus: "Mostre um gesto diante da chave antes da decisão.",
        quotes: [
          { label: "Ponto forte", text: "A chave ficou na mesa" },
          { label: "Aderência", text: "Ela esperou." },
        ],
        readingHref: "/dashboard/texts/scene-1",
      }}
    />
  )
}
