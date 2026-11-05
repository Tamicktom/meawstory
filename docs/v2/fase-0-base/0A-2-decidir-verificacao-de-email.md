# 0A-2 · Decidir quando exigir verificação de e-mail

**Fase 0 · Etapa A — Decisões** · Tipo: Decisão · [Card pai](../00-card-pai.md)

## Objetivo
Reduzir contas criadas em série sem impedir que a pessoa comece a escrever.

## Escopo
- Decidir se a verificação será obrigatória antes da primeira leitura.
- Manter a escrita e o salvamento liberados antes da verificação.
- Definir a mensagem e o caminho para reenviar o e-mail, caso a verificação seja adotada.

## Critérios de conclusão
- A decisão e seu ponto de aplicação no fluxo estão registrados.

## Observação
A implementação fica em 0B-6.

## Resultado

**Decisão tomada em 2026-11-04:** a verificação de e-mail é obrigatória para iniciar uma leitura. Escrever e salvar continuam liberados antes da verificação.

**Ponto de aplicação:**

- A checagem fica no servidor, no início de cada leitura, antes dos limites de 0A-1. Uma tentativa bloqueada não consome leitura.
- O e-mail de verificação é enviado no cadastro.
- O login não exige verificação. No Better Auth, `emailAndPassword.requireEmailVerification` fica desligado, porque bloquearia a entrada e, com ela, a escrita.
- Contas existentes com `emailVerified` falso seguem o mesmo caminho, sem migração.

**Mensagem na tentativa de leitura:** “Confirme seu e-mail para receber a leitura. Sua cena está salva.”

**Caminho para reenviar:** a mesma mensagem traz a ação “Reenviar e-mail”. Depois de confirmar, a pessoa volta para a cena, com o texto preservado, e pode iniciar a leitura.

**Cards afetados:** 0B-6 continua valendo e depende de 0B-4.
