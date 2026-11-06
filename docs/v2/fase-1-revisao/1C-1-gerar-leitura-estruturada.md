# 1C-1 · Gerar a leitura estruturada por critério

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Substituir o markdown corrido por dados que sustentem faixas, evidências, comparação e progresso.

## Escopo
- Produzir leitura geral de dois a três períodos.
- Produzir um único ponto forte com trecho citado.
- Cobrir todos os critérios com o que funciona, o que falta e um trecho citado.
- Produzir um único foco de revisão, concreto e executável.
- Não reescrever a cena nem entregar frases prontas para copiar.

## Critérios de conclusão
- A resposta válida contém todas as partes previstas e não depende de parsing de markdown para alimentar a interface.

## Dependências
- [1B-1 · Estruturar a rubrica e criar sua versão pública](1B-1-estruturar-rubrica-e-versao-publica.md)

## Resultado

**Implementado em 2026-11-05.** O modelo devolve um objeto estruturado (`correctionOutputSchema`, em `workflows/correction-config.ts`): para cada um dos cinco critérios, pontuação, o que funciona, o que falta e uma ou duas citações; depois, um único ponto forte com citação, a leitura geral e um único foco de revisão. As instruções pedem leitura geral de dois a três períodos, proíbem reescrever a cena e entregar frases prontas, e pedem o foco concreto e executável.

O servidor monta o `structured_result` versionado a partir dessa resposta (`lib/reading-assembly.ts`). A interface atual continua lendo `content`, que agora é markdown *gerado* a partir da estrutura (`lib/reading-markdown.ts`); nada é extraído do markdown. A tela estruturada fica para 1F-1.

A seção final das rubricas, escrita para a leitura em markdown ("O que escrever na correção"), sai do prompt. O `rubric_content` congelado não muda, então tentativas antigas continuam podendo ser repetidas.

A validação de qualidade (elogio vazio, tom, ausência de reescrita, consistência) fica para 1D-1.
