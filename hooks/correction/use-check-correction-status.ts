"use client";
//* Libraries imports
import { useQuery } from "@tanstack/react-query";

//* API imports
import { client } from "@/lib/eden";

async function checkCorrectionStatus(textId: string) {
  const response = await client.api.correction["check-correction-status"]({ textId }).get();

  return response;
}

export function useCheckCorrectionStatus(textId?: string | null) {
  return useQuery({
    queryKey: ["correction-status", textId],
    queryFn: () => checkCorrectionStatus(textId ?? ""),
    enabled: !!textId, //* Only fetch if textId is provided
  });
}