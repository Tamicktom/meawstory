"use client"

//* Components imports
import { Button } from "@/components/ui/button"

//* Local imports
import { authClient } from "@/lib/auth-client"

export function SignOutButton() {
  return (
    <Button
      id="account-sign-out"
      type="button"
      variant="outline"
      className="w-fit"
      onClick={() => {
        void authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.assign("/sign-in")
            },
          },
        })
      }}
    >
      Sair
    </Button>
  )
}
