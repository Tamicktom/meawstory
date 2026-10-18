"use client"
//* Libraries imports
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import StarterKit from "@tiptap/starter-kit"
import { useEditor, EditorContent } from "@tiptap/react"

//* Components imports
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

//* Hooks imports
import { useWriteText, writeTextErrorMessage } from "@/hooks/write/use-write-text";
import { useCheckCorrectionStatus } from "@/hooks/correction/use-check-correction-status";
import { useInterval } from "@/hooks/utils/use-interval";

const INITIAL_CONTENT = "<p>Hello World! 🌎️</p>";
const INTERVAL_CHECK_CORRECTION_STATUS = 3_000;

type EditorProps = {
  themeId: string
}

const Editor = (props: EditorProps) => {
  const router = useRouter()
  const [textId, setTextId] = useState<string | null>(null);
  const [isWaitingForCorrection, setIsWaitingForCorrection] = useState(false);
  const [correctionFailed, setCorrectionFailed] = useState(false);
  const submittedTextId = useRef<string | null>(null);

  const writeText = useWriteText();
  const checkCorrectionStatus = useCheckCorrectionStatus({
    textId,
    onCompleted: () => {
      const completedTextId = submittedTextId.current;
      setIsWaitingForCorrection(() => false);
      setTextId(() => null);
      if (completedTextId) {
        router.push(`/dashboard/texts/${completedTextId}`);
      }
    },
    onFailed: () => {
      setIsWaitingForCorrection(false);
      setTextId(null);
      setCorrectionFailed(true);
    },
  });

  useInterval(() => {
    checkCorrectionStatus.refetch();
  }, textId ? INTERVAL_CHECK_CORRECTION_STATUS : null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: INITIAL_CONTENT,
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })

  const handleSubmit = () => {
    const content = editor?.getText() || ""

    setCorrectionFailed(false);

    writeText.mutate(
      {
        themeId: props.themeId,
        content,
      },
      {
        onSuccess: (response) => {
          const nextTextId =
            response.data && "textId" in response.data
              ? response.data.textId
              : undefined

          if (!nextTextId) {
            return
          }

          submittedTextId.current = nextTextId;
          setTextId(nextTextId);
          setIsWaitingForCorrection(true);
        },
      }
    )
  }

  const showError = writeText.isError || correctionFailed;

  return (
    <div className="col-span-2 flex h-full w-full max-w-5xl flex-col items-start justify-start gap-2">
      <Button
        id="submit-text"
        type="button"
        disabled={isWaitingForCorrection || writeText.isPending}
        onClick={handleSubmit}
      >
        Enviar texto
      </Button>
      {isWaitingForCorrection ? (
        <p className="flex items-center gap-2 p-1 text-sm text-muted-foreground">
          <Spinner />
          <span>A correção está sendo preparada.</span>
        </p>
      ) : null}
      {showError ? (
        <p className="p-1 text-sm text-destructive">{writeTextErrorMessage}</p>
      ) : null}
      <EditorContent className="h-full w-full" editor={editor} />
    </div>
  )
}

export { Editor }
