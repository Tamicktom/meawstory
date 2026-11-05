"use client"

//* Libraries imports
import { QueryClientProvider } from "@tanstack/react-query";

//* Local imports
import { queryClient } from "@/utils/query-client";

type QueryProviderProps = {
  children: React.ReactNode
}

function QueryProvider(props: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}

export { QueryProvider }
