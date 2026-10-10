# Explicações sobre a estrutura do banco com a regra de negócio.

## Soft deletes

O sistema usa soft-deletes.

## Autenticação, sessão, conta...

As tabelas `user`, `session`, `account` e `verification` são o feijão com arroz para saber quem é quem, se está logado, se o email já foi verificado...

Nada fora do que se costuma encontrar em sistemas.

## Principal

`rubric` -> É a rubrica que a IA vai usar para a correção de um texto.
`theme` -> Tema que um texto pode ser escrito.
`text` -> É o texto que o usuário vai escrever, de acordo com o tema.
`correction` -> É a correção de um texto escrito pelo usuário. A correção é feita pela IA seguindo a rubrica.

- 1 `user` pode escrever N `text`. 1 `text` pode pertencer a 1 `user`.
- 1 `text` pode ter apenas 1 `theme`. 1 `theme` pode ser usado por N `text`.
- 1 `text` pode ter N `correction`. 1 `correction` pertence apenas a 1 `text`.
- 1 `correction` pode usar apenas 1 `rubric`. 1 `rubric` pode ser usada por N `correction`.
- 1 `theme` pode ter apenas 1 `rubric`. 1 `rubric` pode pertencer a N `theme`.