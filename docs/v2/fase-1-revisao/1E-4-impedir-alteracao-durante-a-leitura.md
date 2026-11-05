# 1E-4 · Impedir alteração do texto durante a leitura

**Fase 1 · Etapa E — Escrita** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Evitar que o workflow falhe ou associe o resultado a um texto diferente do avaliado.

## Escopo
- Bloquear a edição da versão enviada ou separar qualquer novo rascunho dela.
- Manter visível o texto congelado enquanto a leitura está na fila ou em andamento.
- Impedir que outra aba ou o salvamento automático altere a mesma versão durante o processamento.
- Explicar o estado sem sugerir que o texto foi perdido.
- Respeitar a regra de `database/schema.md`: ao inserir a leitura, `text_content` precisa ser igual ao `text.content` atual.

## Critérios de conclusão
- O conteúdo salvo com a leitura é exatamente o conteúdo enviado à avaliação, mesmo com ações concorrentes.

## Dependências
- [1E-3 · Salvar rascunho automaticamente no servidor](1E-3-salvar-rascunho-no-servidor.md)

## Observação
Este card vem logo depois do rascunho, porque o salvamento automático torna o risco imediato, antes mesmo da revisão existir.
