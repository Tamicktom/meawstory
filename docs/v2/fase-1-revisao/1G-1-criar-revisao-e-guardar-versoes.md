# 1G-1 · Criar uma revisão e guardar as versões

**Fase 1 · Etapa G — Revisão e versões** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Permitir reescrever a partir do foco sem alterar nenhuma versão anterior.

## Escopo
- Abrir “Revisar com esse foco” com o conteúdo da última versão.
- Trocar o painel do briefing pelo foco e pelos trechos citados.
- Preservar cada texto congelado nas leituras concluídas, sem criar versões para falhas.
- Numerar e identificar as versões na interface.
- Salvar a nova versão como rascunho até o próximo envio.
- Registrar as decisões em `database/schema.md`.
- Aplicar à nova versão a mesma proteção de 1E-4 durante a leitura.

## Critérios de conclusão
- Revisar não altera o texto nem a leitura anterior.
- A nova versão mantém o foco visível e pode ser salva e retomada.

## Dependências
- [1D-2 · Testar o protótipo de leitura e revisão com escritores](1D-2-testar-prototipo-de-leitura-e-revisao.md)
- [1E-3 · Salvar rascunho automaticamente no servidor](1E-3-salvar-rascunho-no-servidor.md)
- [1E-4 · Impedir alteração do texto durante a leitura](1E-4-impedir-alteracao-durante-a-leitura.md)
- [1F-1 · Criar a tela da leitura estruturada](1F-1-criar-tela-da-leitura-estruturada.md)
