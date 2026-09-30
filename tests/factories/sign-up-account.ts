//* Libraries imports
import { faker } from "@faker-js/faker"

export type SignUpAccount = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export function createSignUpAccount(
  overrides: Partial<SignUpAccount> = {}
): SignUpAccount {
  const password = `Pw!${faker.string.alphanumeric(12)}`

  return {
    name: faker.person.fullName(),
    email: `e2e.${faker.string.uuid()}@example.com`,
    password,
    confirmPassword: password,
    ...overrides,
  }
}
