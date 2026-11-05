//* Local imports
import { auth } from "@/lib/auth"

const testUser = {
  name: "Test User",
  email: "user@user.user",
  password: "123123Qq!",
} as const

export async function seedTestUser(): Promise<{
  email: string
  created: boolean
}> {
  const context = await auth.$context
  const existing = await context.internalAdapter.findUserByEmail(
    testUser.email,
    { includeAccounts: true }
  )
  const passwordHash = await context.password.hash(testUser.password)

  if (!existing) {
    const createdUser = await context.internalAdapter.createUser(
      {
        name: testUser.name,
        email: testUser.email,
        emailVerified: true,
      },
      { method: "email-password" }
    )

    await context.internalAdapter.linkAccount({
      userId: createdUser.id,
      providerId: "credential",
      accountId: createdUser.id,
      password: passwordHash,
    })

    return {
      email: createdUser.email,
      created: true,
    }
  }

  const credentialAccount = existing.accounts.find((account) => {
    return account.providerId === "credential"
  })

  if (credentialAccount) {
    await context.internalAdapter.updatePassword(existing.user.id, passwordHash)
  } else {
    await context.internalAdapter.linkAccount({
      userId: existing.user.id,
      providerId: "credential",
      accountId: existing.user.id,
      password: passwordHash,
    })
  }

  if (!existing.user.emailVerified) {
    await context.internalAdapter.updateUser(existing.user.id, {
      emailVerified: true,
    })
  }

  return {
    email: existing.user.email,
    created: false,
  }
}
