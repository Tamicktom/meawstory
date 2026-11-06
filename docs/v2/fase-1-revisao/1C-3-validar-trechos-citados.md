# 1C-3 · Validar os trechos citados pela leitura

**Fase 1 · Etapa C — Motor e operação da leitura** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Garantir que toda crítica tenha evidência literal na cena avaliada.

## Escopo
- Conferir no servidor se cada citação existe literalmente no texto congelado.
- Associar a citação ao critério correspondente.
- Escolher e registrar a regra para uma citação inexistente: refazer a leitura ou descartar o trecho.
- Não permitir comentário sem evidência no formato estruturado final.

## Critérios de conclusão
- Nenhuma leitura concluída exibe como citação um trecho que não pertence à cena.

## Dependências
- [1C-1 · Gerar a leitura estruturada por critério](1C-1-gerar-leitura-estruturada.md)

## Resultado

**Regra escolhida em 2026-11-05, por Tamicktom: descartar e refazer só quando faltar evidência.**

- Cada critério traz uma ou duas citações, e o ponto forte traz uma. O servidor confere cada uma no texto congelado da cena (`lib/reading-quotes.ts`).
- A citação precisa ser um trecho contínuo e literal da cena, com pelo menos três palavras. A conferência tolera só o que o modelo não reproduz byte a byte: espaços repetidos, tipo de aspas, travessão e hífen, reticências como caractere e maiúsculas. Acentos, palavras e ordem precisam bater; uma omissão marcada com "..." não vale. Citações do enunciado não valem.
- A citação que não está na cena é descartada. Se o ponto forte, ou algum critério, ficar sem nenhuma citação válida, a leitura é refeita uma vez, com o motivo. Se a segunda resposta também falhar, a tentativa falha como recuperável.
- O que se grava é o trecho da própria cena, e não a versão do modelo, para que 1F-3 possa marcá-lo no texto.
- O banco recusa uma leitura estruturada com citação que não esteja em `text_content` (`correction_evidence_in_scene`) ou com critério sem citação.

As chamadas refeitas por validação ficam em `reading_call`, com o motivo, e entram no custo (1C-6). A taxa de citações descartadas e de leituras refeitas no conjunto inteiro é medida em 1D-1.
