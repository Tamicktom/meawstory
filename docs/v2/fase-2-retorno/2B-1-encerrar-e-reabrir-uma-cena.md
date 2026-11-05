# 2B-1 · Encerrar e reabrir uma cena

**Fase 2 · Etapa B — Histórico e encerramento** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Dar conclusão ao trabalho por decisão de quem escreve, sem bloquear uma retomada.

## Escopo
- Oferecer “Dar a cena por encerrada” na leitura e na comparação.
- Permitir desfazer ou reabrir a cena depois.
- Expor a situação da cena para Minhas cenas, catálogo e Início.
- Aceitar encerramento com qualquer faixa, sem tratar pontuação baixa como desistência.
- Registrar a regra em `database/schema.md` antes da migração.

## Critérios de conclusão
- Encerrar e reabrir são reversíveis, e a situação atual fica disponível para as listas sem apagar versões.

## Dependências
- [1F-1 · Criar a tela da leitura estruturada](../fase-1-revisao/1F-1-criar-tela-da-leitura-estruturada.md)
- [1H-2 · Exibir a comparação entre versões](../fase-1-revisao/1H-2-exibir-comparacao-entre-versoes.md)
