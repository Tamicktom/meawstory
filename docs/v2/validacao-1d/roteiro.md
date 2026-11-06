# Teste de leitura e revisão com escritores · 1D-2

Este roteiro prepara o teste; não contém resultados. O andamento fica no [card pai](../00-card-pai.md). A decisão técnica está em [resultado.md](resultado.md). A dependência de 1D-1 deve ser resolvida antes das sessões: se o portão tiver falhas bloqueantes, corrigir e medir de novo, ou registrar uma decisão explícita da pessoa responsável sobre o que será investigado com o material falho.

## Pergunta

Depois de ler a leitura estruturada, a pessoa sabe dizer o que mudaria na cena, encontra como começar e quer reescrever? Separar compreensão, disposição e comportamento observado: clicar no botão não prova que a leitura ajudou.

## Pessoas e duração

Recrutar de 5 a 10 pessoas adultas que escrevem ficção, incluindo quem revisa regularmente e quem está começando. Buscar mais de um gênero e pelo menos duas sessões no celular. Uma sessão individual de 25 a 35 minutos, facilitada por alguém que não explique a tela antes da tarefa. Convidar pelo canal já usado pelo projeto; nenhum convite é enviado automaticamente.

Explicar antes: “Estamos testando a leitura e o caminho de revisão, não sua escrita. Você pode discordar, interromper ou pular qualquer pergunta. Usaremos uma cena de referência; não pediremos texto pessoal. O protótipo não salva nem envia nada. Posso anotar suas respostas sem seu nome? Posso guardar uma frase literal sem identificação?”. Gravar áudio ou tela só com consentimento separado; não é necessário para o teste.

Usar P01 a P10 nas fichas. Manter contatos e consentimentos fora do repositório. Não colocar nomes, e-mails ou textos pessoais nas notas versionadas. Registrar apenas as respostas autorizadas e remover trechos identificáveis antes de compartilhar. Combinar o prazo de descarte das notas brutas com cada participante; não presumir que a política de dados do app cobre a pesquisa.

## Material e preparação

```sh
bun run eval:prototype evaluation/reference/baselines/2026-11-06-estruturada-portao
```

Abrir `evaluation/reference/forms/1d/prototipo-leitura-revisao.html` por duplo clique. Não exige conta, internet, servidor ou chave. Compartilhar esse único HTML, que leva cenas e leituras dentro dele. Os arquivos gerados ficam fora do Git, como os demais formulários de avaliação.

O protótipo é descartável e não instala telas de F, G ou H no produto. Mostra leitura geral, ponto forte, foco, critérios, nota recolhida, cena anterior e cópia editável. Permite discordar, voltar à leitura e conferir a revisão. O ensaio termina antes de uma nova chamada de IA ou comparação. Recarregar apaga tudo; voltar entre as etapas conserva o rascunho na aba. Os percursos guiados são para exploração posterior, porque revelam os botões e contaminariam a tarefa inicial.

Há seis cenas, uma por gênero: `acao-02`, `luta-02`, `romance-04`, `dialogo-02`, `suspense-02`, `virada-02`. Usa-se a rodada #1, com uma exceção registrada: `dialogo-02 #1` terminou em timeout e ficou na medição como falha; para o protótipo, usa-se #2, primeiro slot concluído desse caso. A seleção não escolhe a melhor resposta entre cinco rodadas, e a falha não é apagada nem trocada na inspeção qualitativa. Inclui defeitos conhecidos para que o teste possa revelar elogio excessivo e foco prescritivo. São cenas escritas com IA para o conjunto de referência, não obras dos participantes. Registrar essa limitação ao interpretar motivação para revisar; revisar uma cena alheia não mede o retorno à própria obra.

Distribuir os gêneros pelo interesse das pessoas, sem concentrar todas na mesma cena. Anotar caso, rodada, data do arquivo e aparelho. Antes de cada sessão, reiniciar o ensaio, selecionar a cena, abrir “Ler a cena anterior” e esconder os percursos guiados. Compartilhar a tela só depois disso, para que a leitura de IA não contamine a percepção inicial da cena. Abrir o arquivo antes da sessão e conferir o funcionamento no aparelho, sobretudo a entrega do HTML no celular. Se o aparelho não permitir abrir HTML local, registrar a limitação e usar compartilhamento de tela com a pessoa dirigindo as ações; não contar essa sessão como interação móvel direta.

## Condução

1. **Contexto, 3 minutos.** Perguntar que tipo de ficção escreve, frequência de revisão e se já recebeu leitura crítica ou de IA. Não apresentar as vantagens esperadas do produto.
2. **Cena e exercício, 5 minutos.** Pedir que leia o exercício e a cena anterior. Perguntar o que percebe como principal problema antes de mostrar a leitura. Anotar a resposta para distinguir descoberta de concordância induzida.
3. **Leitura livre, 5 minutos.** “Veja esta leitura como se tivesse acabado de recebê-la. Conte o que está entendendo.” Observar o caminho sem apontar foco, critérios, nota ou botão. Anotar tempo, hesitações e pedidos de ajuda.
4. **Próxima ação, antes de clicar.** Perguntar exatamente: **“Depois dessa leitura, você sabe o que mudar e quer reescrever?”** Depois: “O que você mudaria primeiro? Em qual trecho? O que espera que isso produza?”. Separar a resposta espontânea da resposta obtida depois de ajuda.
5. **Evidência e tom, 4 minutos.** “Mostre um trecho que sustenta a leitura. Há algo que você discorda ou que não entendeu? Como recebeu o tom? Algum elogio parece não combinar com a cena?”. Não sugerir que há um erro ou que o foco está certo. Perguntar se ficou claro o que a faixa significa e que a nota não define o valor da escrita.
6. **Revisão, 5 a 8 minutos.** “Se fosse continuar, mostre por onde começaria. Faça uma pequena alteração se quiser.” Não exigir reescrita nem escolher a alteração. Observar se acha o caminho, se o foco continua acessível e se entende qual versão está alterando. Pedir que volte à leitura para conferir uma evidência e retome o rascunho. Conferir se teme perder a versão anterior.
7. **Conferência, 3 minutos.** Pedir que avance até onde enviaria a revisão. Perguntar o que espera acontecer depois, o que deve permanecer guardado e como saberia se houve melhora. O protótipo não promete ganho de pontos, não gera leitura nova e não apresenta comparação simulada como resultado real.
8. **Fechamento.** Perguntar o que mudaria na leitura ou no percurso, se usaria com uma cena própria e por quê. Só então mostrar percursos guiados se houver interesse. Confirmar quais frases podem entrar nas notas.

## Registro por sessão

Copiar [ficha-sessao.md](ficha-sessao.md) para uma nota local por pessoa. Não preencher as linhas com previsões. Uma resposta negativa é resultado válido; uma falha da leitura deve ficar separada de dificuldade de interface. Registrar intervenções da pessoa facilitadora e não reclassificar sucesso com ajuda como descoberta espontânea.

## Decidir depois das sessões

Com pelo menos cinco sessões válidas, registrar numerador e denominador de cada observação, com exemplos e contraexemplos. A amostra é qualitativa e não representa uma estimativa populacional. Os sinais abaixo foram escolhidos para decidir o próximo passo, não para fazer teste estatístico:

- Pelo menos 4 em cada 5 participantes conseguem, sem ajuda, apontar uma mudança concreta, localizar o trecho relacionado e explicar o efeito esperado. Para 6 a 10 participantes, usar pelo menos 80%, arredondando para cima.
- Pelo menos 80% encontram a revisão, reconhecem a versão anterior como preservada e retomam o rascunho depois de consultar a leitura.
- Registrar disposição para reescrever em separado, incluindo motivo e diferença entre cena alheia e própria. Não converter vontade declarada em retenção ou exigir entusiasmo para considerar uma crítica útil.
- Nenhum problema grave de tom, evidência inventada, reescrita pronta, foco incompreensível ou percepção de perda da cena anterior fica sem decisão. Um único caso grave pede investigação, mesmo que os demais tenham sucesso.

Agrupar dificuldades em compreensão, tom, evidência, escolha do foco e navegação. Para cada problema: fonte (sessão e frase autorizada), gravidade, recorrência, decisão, card afetado e como verificar a mudança. Alterações no modelo ou prompt exigem nova medição; mudanças no protótipo exigem novas sessões com quem ainda não viu a versão alterada. Não misturar rodadas como se fossem o mesmo protótipo.

Fechar 1D-2 só com respostas, problemas observados e decisões registradas. Depois de validado, preservar a versão exata do HTML como fonte da pesquisa numa branch descartável e guardar o commit junto das decisões, conforme a skill Prototype. Até lá, o gerador e o template permitem reproduzir o material. F, G e H continuam aguardando a decisão do portão.
