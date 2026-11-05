# 0B-4 · Configurar o envio de e-mails com Resend

**Fase 0 · Etapa B — Entrada e conta** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Disponibilizar a infraestrutura necessária para recuperação de senha e futuras notificações.

## Escopo
- Integrar o Resend usando o domínio `meawstory.com`.
- Usar `Meawstory <nao-responda@meawstory.com>` como remetente.
- Tratar falha de envio sem expor detalhes técnicos na interface.

## Critérios de conclusão
- Um e-mail transacional de teste é entregue pelo domínio configurado.

## Observação
**Decisão de 2026-11-05:** a caixa de contato sai do escopo e fica para depois do MVP, que será testado apenas com pessoas convidadas. Por isso, o remetente deixou de ser `contato@meawstory.com` e os e-mails não têm endereço de resposta.
