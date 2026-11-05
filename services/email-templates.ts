//* Local imports
import type { EmailMessage } from "@/services/email"

type AccountEmail = {
  name: string
  email: string
  url: string
}

type LayoutProps = {
  name: string
  intro: string
  action: string
  url: string
  note: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function renderHtml(props: LayoutProps) {
  const url = escapeHtml(props.url)

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f7f7f5;color:#1c1917;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">
    <div style="max-width:520px;margin:0 auto;padding:32px;background:#ffffff;border-radius:8px">
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:20px">Meawstory</p>
      <p style="margin:0 0 16px">Olá, ${escapeHtml(props.name)}.</p>
      <p style="margin:0 0 24px">${escapeHtml(props.intro)}</p>
      <p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;padding:12px 20px;background:#f5c518;color:#422c0a;border-radius:6px;font-weight:bold;text-decoration:none">${escapeHtml(props.action)}</a></p>
      <p style="margin:0 0 8px;color:#57534e;font-size:14px">${escapeHtml(props.note)}</p>
      <p style="margin:0;color:#57534e;font-size:14px">Se o botão não funcionar, copie este endereço: ${url}</p>
    </div>
  </body>
</html>`
}

function renderText(props: LayoutProps) {
  return [
    `Olá, ${props.name}.`,
    "",
    props.intro,
    "",
    `${props.action}: ${props.url}`,
    "",
    props.note,
    "",
    "Meawstory",
  ].join("\n")
}

function accountEmail(
  to: string,
  subject: string,
  props: LayoutProps
): EmailMessage {
  return {
    to,
    subject,
    html: renderHtml(props),
    text: renderText(props),
  }
}

function verificationEmail(account: AccountEmail): EmailMessage {
  return accountEmail(account.email, "Confirme seu e-mail no Meawstory", {
    name: account.name,
    intro:
      "Confirme seu e-mail para receber leituras das suas cenas. Você já pode escrever enquanto isso.",
    action: "Confirmar e-mail",
    url: account.url,
    note: "Este link vale por 24 horas. Se você não criou esta conta, pode ignorar este e-mail.",
  })
}

function passwordResetEmail(account: AccountEmail): EmailMessage {
  return accountEmail(account.email, "Redefina sua senha do Meawstory", {
    name: account.name,
    intro: "Recebemos um pedido para redefinir a senha da sua conta.",
    action: "Redefinir senha",
    url: account.url,
    note: "Este link vale por 1 hora e só funciona uma vez. Se você não fez este pedido, pode ignorar este e-mail: sua senha continua a mesma.",
  })
}

export { passwordResetEmail, verificationEmail }
