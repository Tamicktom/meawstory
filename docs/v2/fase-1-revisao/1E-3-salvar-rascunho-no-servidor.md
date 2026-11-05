# 1E-3 · Salvar rascunho automaticamente no servidor

**Fase 1 · Etapa E — Escrita** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Garantir que escrever e revisar não dependa de manter uma aba aberta.

## Escopo
- Salvar alterações automaticamente na cena existente.
- Exibir “Salvo há instantes” após confirmação do servidor.
- Em falha, avisar que a página deve permanecer aberta, tentar de novo e oferecer cópia do texto.
- Ao expirar a sessão, preservar o texto na tela e permitir entrar novamente para salvar.
- Tratar cena sem leitura iniciada como rascunho, sem criar tabela exclusiva para isso.

## Critérios de conclusão
- Recarregar a página recupera a última versão confirmada.
- Falha de rede ou sessão não apaga o conteúdo ainda não salvo.

## Dependências
- [0C-8 · Destravar cena salva sem leitura iniciada](../fase-0-base/0C-8-destravar-cena-sem-leitura-iniciada.md)
