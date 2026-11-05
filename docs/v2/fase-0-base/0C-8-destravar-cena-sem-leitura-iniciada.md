# 0C-8 · Destravar cena salva sem leitura iniciada

**Fase 0 · Etapa C — Ciclo atual confiável** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Evitar que texto salvo permaneça indefinidamente como “aguardando” quando nenhuma correção começou.

## Escopo
- Distinguir rascunho salvo de leitura na fila ou em andamento.
- Permitir continuar editando uma cena que nunca iniciou leitura.
- Tratar interrupções entre salvar o texto e iniciar o workflow.
- Não apresentar essa situação como falha de leitura.
- Abrir a escrita a partir de uma cena existente, em vez de criar outra a cada envio.

## Critérios de conclusão
- Uma cena salva sem tentativa de leitura sempre pode ser reaberta e enviada, sem ficar presa em espera.

## Observação
0B-6 criou a tela da cena salva sem leitura (`components/reading/reading-gate.tsx`) e `POST /api/correction/start/:textId`. A tela já permite pedir a leitura, mas ainda não reabre a escrita. Entre o clique em enviar e a criação da correção, ela também pode oferecer a leitura de uma cena que acabou de iniciá-la. Este card precisa distinguir esses casos.

## Dependências
- [0C-1 · Transformar a lista de textos em Minhas cenas](0C-1-transformar-lista-de-textos-em-minhas-cenas.md)
