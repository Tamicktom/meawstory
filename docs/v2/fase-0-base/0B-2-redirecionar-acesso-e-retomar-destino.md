# 0B-2 · Redirecionar acesso e retomar o destino

**Fase 0 · Etapa B — Entrada e conta** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Eliminar o “Unauthorized” e levar cada pessoa ao lugar certo depois da autenticação.

## Escopo
- Redirecionar quem não tem sessão de uma rota interna para o login.
- Guardar o destino interno solicitado e retornar a ele depois da entrada.
- Levar ao Início quem abre login ou cadastro já autenticado.
- Usar o Início como destino padrão quando não houver rota de origem.

## Critérios de conclusão
- Nenhuma rota protegida exibe “Unauthorized” como página final.
- O retorno preserva somente destinos internos válidos.

## Observação
O Início é hoje `/dashboard`. A orientação pela próxima ação chega em 2E-1.
