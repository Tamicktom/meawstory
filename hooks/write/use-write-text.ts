"use client";
//* libraries imports
import { useMutation } from "@tanstack/react-query";

//* API imports
import { client } from "@/lib/eden";
import { queryClient } from "@/utils/query-client";

const writeTextErrorMessage = "Erro ao enviar texto";

type WriteTextProps = {
  themeId: string;
  content: string;
}

async function writeText(props: WriteTextProps) {
  const response = await client.api.write({ themeId: props.themeId }).post({ content: props.content });

  if (response.error) {
    throw new Error(writeTextErrorMessage);
  }

  return response;
}


export function useWriteText() {
  return useMutation({
    mutationFn: writeText,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["correction-status"] });
      console.log("Texto enviado com sucesso");
    },
    onError: () => {
      console.log(writeTextErrorMessage);
    },
  });
}

export { writeTextErrorMessage };