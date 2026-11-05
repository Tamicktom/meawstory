# 1F-4 · Coletar se a leitura ajudou

**Fase 1 · Etapa F — Tela da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Medir a qualidade percebida sem confundir satisfação com pontuação.

## Escopo
- Exibir “Essa leitura ajudou?” ao fim de cada leitura estruturada.
- Aceitar “Sim”, “Em parte” ou “Não”.
- Permitir uma resposta por pessoa e versão, com possibilidade de correção da escolha.
- Associar a resposta à leitura, ao modelo e à versão do prompt.
- Alimentar as métricas de qualidade e o conjunto de avaliação.

## Critérios de conclusão
- A resposta fica ligada à leitura correta e pode ser analisada sem alterar a pontuação.

## Dependências
- [1B-5 · Registrar modelo e versão do prompt em cada leitura](1B-5-registrar-modelo-e-versao-do-prompt.md)
- [1F-1 · Criar a tela da leitura estruturada](1F-1-criar-tela-da-leitura-estruturada.md)
