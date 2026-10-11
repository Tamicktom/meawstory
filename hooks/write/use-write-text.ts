"use client";
//* libraries imports
import { useMutation } from "@tanstack/react-query";

//* API imports
import { client } from "@/lib/eden";

type WriteTextProps = {
  themeId: string;
  content: string;
}

async function writeText(props: WriteTextProps) {
  const response = await client.api.write({ themeId: props.themeId }).post({ content: props.content });

  return response;
}


export function useWriteText() {
  return useMutation({
    mutationFn: writeText,
    onSuccess: () => {
      console.log("Texto enviado com sucesso");
    },
    onError: () => {
      console.log("Erro ao enviar texto");
    },
  });
}