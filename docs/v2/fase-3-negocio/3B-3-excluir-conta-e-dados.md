# 3B-3 · Excluir a conta e os dados

**Fase 3 · Etapa B — Conta e dados** · Tipo: Implementação · [Card pai](../00-card-pai.md)

> **Fora deste ciclo (2026-11-06).** Não se aplica. A exclusão de conta fica fora do MVP. Pedidos sobre dados seguem o canal já descrito na Fase 0. O texto abaixo fica como registro.

## Objetivo
Atender ao controle dos próprios dados e à LGPD com um fluxo claro e seguro.

## Escopo
- Oferecer exclusão na área Conta com confirmação explícita.
- Explicar o que será excluído e quais prazos ou obrigações de retenção se aplicam.
- Aplicar as regras de exclusão e cascata documentadas em `database/schema.md`.
- Encerrar sessões e interromper comunicações futuras.
- Definir o tratamento de leituras em andamento e assinatura ativa.
- Tratar as linhas de `verification` que guardam o e-mail, porque a cascata de `user` não as apaga.

## Critérios de conclusão
- A conta não volta a autenticar, os dados são tratados conforme o aviso apresentado e nenhuma cena permanece acessível indevidamente.

## Dependências
- [1I-1 · Excluir uma cena com opção de desfazer](../fase-1-revisao/1I-1-excluir-cena-com-opcao-de-desfazer.md)
- [3A-3 · Criar o plano pago](3A-3-criar-plano-pago.md)
