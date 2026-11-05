//* Libraries imports
import { afterAll, describe, expect, it } from "bun:test"
import { eq, inArray, sql } from "drizzle-orm"

//* Local imports
import { db } from "@/database"
import { rubricSeeds, themeSeeds } from "@/database/seed/catalog"
import { seedNarrativeCatalog, seedTestUser } from "@/database/seed"
import { rubric, theme, user } from "@/database/schema"
import { auth } from "@/lib/auth"

const testUserEmail = "user@user.user"
const testUserPassword = "123123Qq!"

async function deleteTestUser(): Promise<void> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, testUserEmail))

  const existingUser = existing[0]

  if (!existingUser) {
    return
  }

  await db.delete(user).where(eq(user.id, existingUser.id))
}

async function credentialAccount() {
  const context = await auth.$context
  const found = await context.internalAdapter.findUserByEmail(testUserEmail, {
    includeAccounts: true,
  })

  if (!found) {
    throw new Error("Expected user@user.user to exist.")
  }

  const credential = found.accounts.find((account) => {
    return account.providerId === "credential"
  })

  if (!credential?.password) {
    throw new Error("Expected a credential account with a password.")
  }

  return {
    emailVerified: found.user.emailVerified,
    name: found.user.name,
    password: credential.password,
    verify: context.password.verify,
  }
}

afterAll(async () => {
  await seedNarrativeCatalog()
  await seedTestUser()
})

const catalogCounts = {
  rubrics: rubricSeeds.length,
  themes: themeSeeds.length,
}

function catalogSample() {
  const rubricSeed = rubricSeeds[0]
  const themeSeed = themeSeeds[0]
  const alternateRubric = rubricSeeds.find((item) => {
    return item.id !== themeSeed?.rubricId
  })

  if (!rubricSeed || !themeSeed || !alternateRubric) {
    throw new Error(
      "Expected the narrative catalog to contain rubrics and themes."
    )
  }

  return { rubricSeed, themeSeed, alternateRubric }
}

async function overwriteCatalogWithStaleRows(
  sample: ReturnType<typeof catalogSample>
) {
  await db.execute(sql`
    update "rubric"
    set "title" = 'Stale rubric title',
        "content" = 'Stale rubric content',
        "updated_at" = timestamp '2000-01-01 00:00:00'
    where "id" = ${sample.rubricSeed.id}
  `)
  await db.execute(sql`
    update "theme"
    set "title" = 'Stale theme title',
        "description" = 'Stale theme description',
        "rubric_id" = ${sample.alternateRubric.id},
        "updated_at" = timestamp '2000-01-01 00:00:00'
    where "id" = ${sample.themeSeed.id}
  `)
}

async function expectCatalogRowsMatchSeeds(
  sample: ReturnType<typeof catalogSample>
) {
  const storedRubrics = await db
    .select({
      id: rubric.id,
      title: rubric.title,
      content: rubric.content,
      updatedAt: rubric.updatedAt,
    })
    .from(rubric)
    .where(
      inArray(
        rubric.id,
        rubricSeeds.map((item) => item.id)
      )
    )
  const storedThemes = await db
    .select({
      id: theme.id,
      title: theme.title,
      description: theme.description,
      rubricId: theme.rubricId,
      updatedAt: theme.updatedAt,
    })
    .from(theme)
    .where(
      inArray(
        theme.id,
        themeSeeds.map((item) => item.id)
      )
    )
  const storedRubric = storedRubrics.find(
    (item) => item.id === sample.rubricSeed.id
  )
  const storedTheme = storedThemes.find(
    (item) => item.id === sample.themeSeed.id
  )
  const refreshedAfter = new Date("2001-01-01T00:00:00.000Z")

  expect(storedRubrics).toHaveLength(rubricSeeds.length)
  expect(storedThemes).toHaveLength(themeSeeds.length)
  expect(storedRubric?.title).toBe(sample.rubricSeed.title)
  expect(storedRubric?.content).toBe(sample.rubricSeed.content)
  expect(storedRubric?.updatedAt.getTime()).toBeGreaterThan(
    refreshedAfter.getTime()
  )
  expect(storedTheme?.title).toBe(sample.themeSeed.title)
  expect(storedTheme?.description).toBe(sample.themeSeed.description)
  expect(storedTheme?.rubricId).toBe(sample.themeSeed.rubricId)
  expect(storedTheme?.updatedAt.getTime()).toBeGreaterThan(
    refreshedAfter.getTime()
  )
}

describe("seedNarrativeCatalog", () => {
  it("upserts rubrics and themes and refreshes updatedAt when the id already exists", async () => {
    const sample = catalogSample()

    try {
      expect(await seedNarrativeCatalog()).toEqual(catalogCounts)
      await overwriteCatalogWithStaleRows(sample)
      expect(await seedNarrativeCatalog()).toEqual(catalogCounts)
      await expectCatalogRowsMatchSeeds(sample)
    } finally {
      await seedNarrativeCatalog()
    }
  })
})

async function expectSeedResetsExistingTestUser() {
  await deleteTestUser()
  await seedTestUser()

  const context = await auth.$context
  const existing = await context.internalAdapter.findUserByEmail(
    testUserEmail,
    { includeAccounts: true }
  )

  if (!existing) {
    throw new Error("Expected user@user.user to exist.")
  }

  const wrongPassword = "NotTheSeedPassword1!"

  await context.internalAdapter.updatePassword(
    existing.user.id,
    await context.password.hash(wrongPassword)
  )
  await context.internalAdapter.updateUser(existing.user.id, {
    emailVerified: false,
  })

  expect(await seedTestUser()).toEqual({
    email: testUserEmail,
    created: false,
  })

  const account = await credentialAccount()

  expect(account.emailVerified).toBe(true)
  expect(
    await account.verify({
      hash: account.password,
      password: testUserPassword,
    })
  ).toBe(true)
  expect(
    await account.verify({
      hash: account.password,
      password: wrongPassword,
    })
  ).toBe(false)
}

describe("seedTestUser", () => {
  it("creates user@user.user with a verified email and a credential account when the email is new", async () => {
    await deleteTestUser()

    expect(await seedTestUser()).toEqual({
      email: testUserEmail,
      created: true,
    })

    const account = await credentialAccount()

    expect(account.name).toBe("Test User")
    expect(account.emailVerified).toBe(true)
    expect(
      await account.verify({
        hash: account.password,
        password: testUserPassword,
      })
    ).toBe(true)
  })

  it("resets the password and marks the email verified when the email already exists", async () => {
    await expectSeedResetsExistingTestUser()
  })
})
