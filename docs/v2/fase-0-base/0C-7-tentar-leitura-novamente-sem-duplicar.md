# 0C-7 · Tentar a leitura novamente sem duplicar a cena

**Fase 0 · Etapa C — Ciclo atual confiável** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Recuperar uma falha sem criar outra cena nem alterar o texto enviado.

## Escopo
- Oferecer “Tentar de novo” somente para leituras com falha.
- Reutilizar a mesma cena e o mesmo conteúdo congelado da tentativa.
- Não contar a tentativa que falhou no limite de envios.
- Manter uma única entrada da cena no histórico.

## Critérios de conclusão
- A nova tentativa não cria uma cena duplicada.
- O texto apresentado na nova tentativa é idêntico ao da tentativa anterior.

## Dependências
- [0C-2 · Exibir cada estado da leitura](0C-2-exibir-estados-da-leitura.md)
- [0C-5 · Limitar envios por pessoa](0C-5-limitar-envios-por-pessoa.md)
