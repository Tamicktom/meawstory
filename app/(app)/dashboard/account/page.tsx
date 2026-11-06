//* Components imports
import { SignOutButton } from "@/components/app/sign-out-button"

//* Local imports
import { requireSession } from "@/lib/session"

export default async function AccountPage() {
  const session = await requireSession()

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 p-4">
      <h1 className="font-heading text-lg font-medium">Conta</h1>
      <dl className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">Nome</dt>
          <dd id="account-name">{session.user.name}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">E-mail</dt>
          <dd id="account-email">{session.user.email}</dd>
        </div>
      </dl>
      <SignOutButton />
    </div>
  )
}
