'use client';
//* Libraries imports
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';

//* Components imports
import { Button } from '@/components/ui/button';

//* Hooks imports
import { useWriteText } from '@/hooks/write/use-write-text';

type EditorProps = {
  themeId: string;
}

const Editor = (props: EditorProps) => {
  const writeText = useWriteText();

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World! 🌎️</p>',
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  });

  const handleSubmit = () => {
    const content = editor?.getText() || "";

    writeText.mutate({
      themeId: props.themeId,
      content,
    });
  }

  return (
    <div className="col-span-2 h-full w-full max-w-5xl flex flex-col items-start justify-start gap-2">
      <Button onClick={handleSubmit}>
        Enviar texto
      </Button>
      <EditorContent className='w-full h-full' editor={editor} />
    </div>
  )
}

export { Editor };