# 0B-3 · Conectar as telas de login e cadastro

**Fase 0 · Etapa B — Entrada e conta** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Garantir que quem escolheu a entrada errada consiga alternar sem procurar outra rota.

## Escopo
- Adicionar link para login na tela de cadastro.
- Adicionar link para cadastro na tela de login.
- Preservar o destino interno pendente ao alternar entre as telas.

## Critérios de conclusão
- As duas telas têm navegação recíproca e mantêm o retorno planejado após autenticar.

## Dependências
- [0B-2 · Redirecionar acesso e retomar o destino](0B-2-redirecionar-acesso-e-retomar-destino.md)

## Observação
O link do login para o cadastro já existe em `components/auth/sign-in-form.tsx`. Falta o caminho inverso e a preservação do destino.
