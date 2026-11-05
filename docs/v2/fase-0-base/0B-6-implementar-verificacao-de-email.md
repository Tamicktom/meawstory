# 0B-6 · Implementar a verificação de e-mail

**Fase 0 · Etapa B — Entrada e conta** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Aplicar a decisão de 0A-2 para dificultar a criação de contas em série sem impedir a escrita.

## Escopo
- Enviar o e-mail de verificação em português pelo Resend.
- Impedir no servidor o início da leitura para contas não verificadas.
- Manter a escrita liberada e preservar o texto quando a leitura for impedida.
- Mostrar a mensagem e o caminho para reenviar o e-mail.

## Critérios de conclusão
- Uma conta não verificada escreve, mas não inicia leitura até confirmar o e-mail.
- Confirmar o e-mail libera a leitura sem perder o texto.

## Dependências
- [0A-2 · Decidir quando exigir verificação de e-mail](0A-2-decidir-verificacao-de-email.md)
- [0B-4 · Configurar o envio de e-mails com Resend](0B-4-configurar-envio-de-emails-com-resend.md)

## Observação
Se 0A-2 decidir não exigir a verificação, marque este card como “não se aplica” no card pai.
