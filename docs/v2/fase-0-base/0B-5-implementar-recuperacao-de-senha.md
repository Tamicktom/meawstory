# 0B-5 · Implementar recuperação de senha por e-mail

**Fase 0 · Etapa B — Entrada e conta** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Permitir que quem esqueceu a senha recupere o acesso sem suporte manual.

## Escopo
- Oferecer o caminho de recuperação a partir do login.
- Enviar instruções em português pelo Resend.
- Criar a tela de redefinição e seus estados de sucesso e erro.
- Não revelar se um e-mail possui conta.
- Invalidar o link conforme as regras de segurança do provedor de autenticação.

## Critérios de conclusão
- Uma pessoa consegue pedir a recuperação, receber o e-mail, definir uma nova senha e entrar.

## Dependências
- [0B-4 · Configurar o envio de e-mails com Resend](0B-4-configurar-envio-de-emails-com-resend.md)
