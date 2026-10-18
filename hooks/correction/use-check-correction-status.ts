"use client";
//* Libraries imports
import { useQuery } from "@tanstack/react-query";

//* API imports
import { client } from "@/lib/eden";

type UseCheckCorrectionStatusProps = {
  textId: string | null;
  onCompleted: () => void;
}

async function checkCorrectionStatus(props: UseCheckCorrectionStatusProps) {
  if (!props.textId) {
    return null;
  }
  const response = await client.api.correction["check-correction-status"]({ textId: props.textId }).get();

  if (response.data?.status === "COMPLETED") {
    props.onCompleted();
  }

  return response;
}

export function useCheckCorrectionStatus(props: UseCheckCorrectionStatusProps) {
  return useQuery({
    queryKey: ["correction-status", props.textId],
    queryFn: () => checkCorrectionStatus(props),
    enabled: !!props.textId, //* Only fetch if textId is provided
  });
}