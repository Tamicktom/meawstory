import { describe, expect, it } from "bun:test"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderToStaticMarkup } from "react-dom/server"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import {
  InvalidResetLink,
  ResetPasswordForm,
} from "@/components/auth/reset-password-form"

describe("password forms initial render", () => {
  it("offers the email reset request and return to sign in", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ForgotPasswordForm />
      </QueryClientProvider>
    )
    expect(html).toContain('id="forgot-password-email"')
    expect(html).toContain("Enviar link")
    expect(html).toContain('href="/sign-in"')
    expect(html).not.toContain('role="alert"')
  })

  it("asks for both password fields with a valid link", () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <ResetPasswordForm token="test-token" />
      </QueryClientProvider>
    )
    expect(html).toContain('id="reset-password-password"')
    expect(html).toContain('id="reset-password-confirm-password"')
    expect(html).toContain("Salvar nova senha")
    expect(html).not.toContain('role="alert"')
  })

  it("offers a new link when the old one is invalid", () => {
    const html = renderToStaticMarkup(<InvalidResetLink />)
    expect(html).toContain('href="/forgot-password"')
    expect(html).not.toContain('type="password"')
  })
})
