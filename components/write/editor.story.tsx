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
