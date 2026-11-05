//* Local imports
import type { RubricDefinition } from "@/database/seed/render-rubric"

const fidelity = 150
const shape = 200
const world = 200
const people = 250
const prose = 200

export const rubricDefinitions: RubricDefinition[] = [
  {
    id: "rubric_action",
    title: "Cena de ação",
    purpose:
      "Corrigir uma cena cujo fôlego vem de movimento: perseguição, fuga, corrida contra um prazo ou travessia sob pressão. O leitor precisa sentir o espaço e o tempo mudando. O desfecho não entra na nota. Escapar, ser alcançado ou escolher parar podem valer o mesmo.",
    howToRead:
      "Leia a cena como movimento no espaço. A pergunta não é quem ganha. A pergunta é se dá para acompanhar corpos, tempo e distância, e se a pressa força uma escolha. Um atalho cômico e uma fuga que falha são caminhos válidos quando o texto os sustenta.",
    doNotPunish: [
      "Frases curtas, frases cortadas e parágrafo de uma linha.",
      "Um obstáculo cômico, constrangedor ou mundano.",
      "Uma fuga que falha, ou uma perseguição que a pessoa abandona.",
    ],
    criteria: [
      {
        name: "Aderência ao tema",
        points: fidelity,
        kind: "objective",
        description:
          "O texto entrega uma cena de ação no contexto do tema. Lugar, pessoas, pressão e o que a cena precisava conter aparecem no que acontece, não só numa frase de resumo.",
        bands: {
          missing: "Não é uma cena de ação, ou abandona o tema.",
          thin: "Há movimento, mas falta o lugar, a pressão ou uma exigência central do tema.",
          working: "A cena cumpre o tema. Uma exigência fica só sugerida.",
          strong:
            "Lugar, pessoas, pressão e exigências do tema estão na cena e mudam o que acontece.",
        },
      },
      {
        name: "Movimento com consequência",
        points: shape,
        kind: "objective",
        description:
          "Corpos atravessam um espaço reconhecível. Um obstáculo muda o plano. No fim, alguém está mais perto, mais longe, ou decidiu parar, e o leitor sabe o que causou isso.",
        bands: {
          missing: "As pessoas se deslocam sem espaço e sem consequência.",
          thin: "Há um trajeto, mas o obstáculo não muda o que elas fazem.",
          working:
            "O espaço atrapalha ou ajuda, e o fim é diferente do começo por causa disso.",
          strong:
            "Cada trecho do trajeto cobra um custo e empurra a escolha seguinte.",
        },
      },
      {
        name: "Clareza em velocidade",
        points: world,
        kind: "objective",
        description:
          "O leitor acompanha quem está onde. Frase curta ajuda. Confusão só funciona quando é a confusão da personagem, e mesmo assim o leitor precisa se reorientar.",
        bands: {
          missing: "Não dá para saber quem se move, nem para onde.",
          thin: "A geografia aparece em relances e se perde no meio.",
          working:
            "Dá para seguir a cena, com um trecho em que a posição fica ambígua.",
          strong:
            "Velocidade e orientação andam juntas. O leitor sente a pressa sem se perder.",
        },
      },
      {
        name: "Pressão e escolha",
        points: people,
        kind: "subjective",
        description:
          "Alguém quer uma coisa concreta, e a cena força uma escolha que custa. Medo, euforia ou teimosia precisam ser desta pessoa. Um rótulo de adrenalina não substitui o custo. Caminhos diferentes de desejo valem a faixa alta se a escolha estiver na página.",
        bands: {
          missing: "Ninguém quer nada específico, ou a pressa é genérica.",
          thin: "O objetivo existe, mas a escolha não custa, ou o custo é anunciado e não mostrado.",
          working:
            "Há uma escolha com custo, e o sentimento cabe nesta pessoa, mesmo com um trecho ainda genérico.",
          strong:
            "Desejo, obstáculo e preço ficam visíveis no que a pessoa faz. Dá para entender por que ela continua ou por que para.",
        },
      },
      {
        name: "Ritmo",
        points: prose,
        kind: "subjective",
        description:
          "O tamanho das frases, os cortes e os detalhes sensoriais acompanham o movimento. Uma pausa pode existir se afiar o gesto seguinte. Prosa seca ou carregada serve quando serve ao passo da cena.",
        bands: {
          missing:
            "O andamento é igual do começo ao fim, ou a prosa trava a ação sem ganho.",
          thin: "Há variação ocasional, mas a prosa não responde ao que está acontecendo.",
          working:
            "O ritmo acompanha a maior parte da cena. Uma passagem importante fica lenta ou apressada demais para o que ela é.",
          strong:
            "Aceleração, pausa e imagem parecem escolhidas. O tempo da cena está no corpo da frase.",
        },
      },
    ],
  },
  {
    id: "rubric_fight",
    title: "Cena de luta",
    purpose:
      "Corrigir um confronto físico. A luta é uma conversa feita com o corpo. Ganhar não aumenta a nota. Derrota, empate, golpe recusado ou uma briga que para cedo podem chegar à faixa alta se a sequência física e o motivo forem legíveis.",
    howToRead:
      "Siga a ordem dos corpos. Pergunte o que cada gesto torna possível ou impossível depois. Uma briga feia, contida, desajeitada ou técnica pode estar certa. O que não pode faltar é causa e efeito.",
    doNotPunish: [
      "Pouca violência, ou violência desagradável, quando a cena assume o tom.",
      "Uma luta que termina antes do nocaute porque alguém escolhe parar.",
      "Um lutador pior, mais lento ou com medo.",
    ],
    criteria: [
      {
        name: "Aderência ao tema",
        points: fidelity,
        kind: "objective",
        description:
          "O texto entrega um confronto físico no contexto do tema. O espaço, quem briga e as exigências da cena entram na luta, em vez de ficar num preâmbulo.",
        bands: {
          missing:
            "Não há confronto físico, ou a cena troca a luta por outro gênero.",
          thin: "Há briga, mas falta o lugar, quem são as pessoas ou uma exigência central do tema.",
          working:
            "A luta cumpre o tema. Uma exigência aparece e quase não altera os golpes.",
          strong:
            "Lugar, pessoas e exigências do tema mudam a maneira como se luta.",
        },
      },
      {
        name: "Causa e efeito físico",
        points: shape,
        kind: "objective",
        description:
          "Golpes, agarrões, erros e limites do corpo acontecem numa ordem que o leitor segue. Dor, cansaço ou hesitação mudam o que o próximo movimento pode ser.",
        bands: {
          missing: "Os corpos se batem sem ordem e sem consequência.",
          thin: "Há uma sequência, mas o corpo no fim está igual ao corpo do começo.",
          working:
            "Um golpe, um erro ou o cansaço muda o movimento seguinte. Um trecho ainda parece sem peso.",
          strong:
            "Cada troca deixa um rastro, e o fim da luta só é possível por causa do que veio antes.",
        },
      },
      {
        name: "Espaço e recursos",
        points: world,
        kind: "objective",
        description:
          "O lugar participa: móvel, clima, distância, arma ou a falta dela. Ninguém muda de posição sem um movimento. O que está ao alcance importa mais do que um arsenal inventado no meio do golpe.",
        bands: {
          missing: "A briga acontece num vazio, sem chão, distância ou objeto.",
          thin: "O lugar é nomeado, mas não limita nem ajuda ninguém.",
          working:
            "Pelo menos um elemento do espaço muda o que alguém consegue fazer.",
          strong:
            "O lugar e o que está à mão conduzem a luta. A geografia continua legível.",
        },
      },
      {
        name: "O que os corpos protegem",
        points: people,
        kind: "subjective",
        description:
          "Dá para entender por que estas pessoas não vão embora, pelo que protegem, recusam ou arriscam. Crueldade e piedade precisam parecer escolhas. Não há um motivo certo: há um motivo que a cena torna visível.",
        bands: {
          missing: "A briga não tem motivo reconhecível nestas pessoas.",
          thin: "O motivo é declarado numa frase e não aparece nos gestos.",
          working:
            "O que está em jogo aparece em pelo menos um gesto de proteção, recusa ou risco.",
          strong:
            "Os golpes, as pausas e o que alguém se recusa a fazer mostram o conflito melhor do que uma explicação.",
        },
      },
      {
        name: "Coreografia legível",
        points: prose,
        kind: "subjective",
        description:
          "A prosa continua legível na velocidade da briga. Nomear cada músculo não vale mais do que uma imagem clara. Um instante parado pode pesar mais do que uma rajada se mudar a luta. Estilo técnico ou bruto serve quando o leitor não se perde.",
        bands: {
          missing:
            "Não dá para visualizar os corpos, ou a prosa só lista golpes.",
          thin: "Alguns gestos são claros e o resto vira sumário de violência.",
          working:
            "A maior parte da luta se acompanha. Uma troca importante fica confusa ou decorativa.",
          strong:
            "Imagem, velocidade e pausa deixam a luta legível e específica. O estilo combina com quem está lutando.",
        },
      },
    ],
  },
  {
    id: "rubric_romance",
    title: "Cena de romance",
    purpose:
      "Corrigir uma cena de desejo, ternura, constrangimento ou conflito romântico entre pessoas adultas. Calor explícito não aumenta a nota, e contenção não a reduz. As duas pessoas precisam continuar com vontade própria.",
    howToRead:
      "Leia a cena como atenção entre pessoas. Um beijo, um quase-beijo, uma piada ou uma recusa podem cumprir o tema. O que importa é o que cada pessoa nota, o que faz com isso e o que muda entre elas até o fim.",
    doNotPunish: [
      "Ausência de sexo, ou sexo entre adultos, quando a cena sustenta a escolha.",
      "Jeito desajeitado, humor ou desejo que não chega a ser dito.",
      "Um não. Recusar o beijo, a confissão ou o convite pode ser o turno da cena.",
    ],
    criteria: [
      {
        name: "Aderência ao tema",
        points: fidelity,
        kind: "objective",
        description:
          "O texto entrega uma cena romântica no contexto do tema, entre pessoas adultas. Aproximação, recuo, objeto e o que precisava ser dito ou calado entram na cena.",
        bands: {
          missing:
            "Não há relação romântica em jogo, ou a cena ignora o contexto do tema.",
          thin: "O tom romântico aparece, mas falta uma exigência central do tema.",
          working: "A cena cumpre o tema. Uma exigência fica decorativa.",
          strong:
            "O contexto do tema conduz a atenção, o toque e o que fica sem dizer.",
        },
      },
      {
        name: "Atenção entre pessoas",
        points: shape,
        kind: "objective",
        description:
          "A cena mostra o que cada pessoa nota na outra e o que faz com isso: uma mão, um silêncio, uma piada, um passo para perto ou para longe. Notar sem consequência fica no meio da escala.",
        bands: {
          missing: "As pessoas dividem o espaço sem se notar.",
          thin: "Há olhares ou elogios genéricos, sem um gesto que responda a eles.",
          working:
            "Um detalhe específico da outra pessoa provoca um gesto, uma fala ou uma retirada.",
          strong:
            "A atenção é mútua ou claramente desigual, e essa diferença aparece em mais de um momento.",
        },
      },
      {
        name: "Virada do vínculo",
        points: world,
        kind: "objective",
        description:
          "No fim, algo entre as pessoas está diferente, mesmo sem declaração. Pode ser uma confissão oferecida, recusada ou adiada, um toque aceito, ou uma distância escolhida.",
        bands: {
          missing: "A relação no fim está igual à relação do começo.",
          thin: "O texto anuncia que algo mudou, sem mostrar a mudança.",
          working: "Há uma virada visível, mas o passo seguinte fica nebuloso.",
          strong:
            "O leitor vê o que mudou e o que cada pessoa fez para isso acontecer.",
        },
      },
      {
        name: "Sentimento específico",
        points: people,
        kind: "subjective",
        description:
          "Desejo, medo, alívio, graça ou mágoa pertencem a estas pessoas e a esta hora. Um gesto conhecido não é falha. Ele sobe de faixa quando um detalhe o torna delas. Há mais de um jeito certo de sentir: o critério é especificidade, não o tipo de afeto.",
        bands: {
          missing: "O sentimento é um rótulo, sem corpo nem ocasião.",
          thin: "A emoção é reconhecível e poderia pertencer a qualquer casal.",
          working:
            "Há detalhes destas pessoas, ao lado de uma formulação ainda pronta.",
          strong:
            "O afeto está nos detalhes e nas escolhas. Tirar os nomes não tornaria a cena intercambiável.",
        },
      },
      {
        name: "Intimidade na prosa",
        points: prose,
        kind: "subjective",
        description:
          "Ritmo, distância e o que fica calado sustentam a cena. A prosa pode ser engraçada, simples ou lírica. Explicar numa frase a emoção que a cena já mostrou segura a nota. Silêncio e frase curta valem tanto quanto metáfora quando fazem o mesmo trabalho.",
        bands: {
          missing:
            "A prosa resume o sentimento e não deixa o leitor dentro do momento.",
          thin: "Há imagens, mas elas repetem o que o narrador já explicou.",
          working:
            "A maior parte da intimidade está mostrada. Uma passagem importante é explicada demais.",
          strong:
            "O que é dito, o que é calado e o andamento da frase criam a intimidade sem um resumo final.",
        },
      },
    ],
  },
  {
    id: "rubric_dialogue",
    title: "Cena de diálogo",
    purpose:
      "Corrigir uma cena que anda sobretudo pela fala. Diálogo precisa fazer mais do que informar. As pessoas querem coisas umas das outras, e a fala é o modo de alcançar, desviar ou apertar.",
    howToRead:
      "Trate cada fala como ação. Informar o leitor de um fato que as personagens já sabem pesa contra a cena. O que importa é o que cada pessoa quer e o que fica por baixo da frase. Elas podem não se entender. Isso também é um resultado.",
    doNotPunish: [
      "Interrupção, silêncio, frase pela metade e gente falando ao mesmo tempo.",
      "Uma pessoa que mente, muda de assunto ou se recusa a responder.",
      "Um discurso mais arrumado, se esta pessoa realmente falaria assim.",
    ],
    criteria: [
      {
        name: "Aderência ao tema",
        points: fidelity,
        kind: "objective",
        description:
          "O texto entrega uma cena conduzida pela fala no contexto do tema. O lugar, quem fala e o que a conversa precisava conter aparecem no diálogo, não num bloco de narração que substitui a cena.",
        bands: {
          missing: "A cena não é conduzida pelo diálogo, ou ignora o tema.",
          thin: "Há conversa, mas uma exigência central do tema fica de fora.",
          working:
            "O diálogo cumpre o tema. Uma exigência entra tarde ou de passagem.",
          strong:
            "Lugar, pessoas e exigências do tema estão dentro da conversa e mudam o que é dito.",
        },
      },
      {
        name: "Vozes separáveis",
        points: shape,
        kind: "objective",
        description:
          "Se as marcas de fala sumissem, o leitor muitas vezes ainda saberia quem fala, pelo vocabulário, pelo ritmo ou pelo que cada pessoa defende. Sotaque e muleta verbal não são obrigatórios.",
        bands: {
          missing: "As falas são intercambiáveis.",
          thin: "Uma pessoa tem algum tique, e a outra fala como o narrador.",
          working:
            "Dá para distinguir as vozes na maior parte da cena, com uma troca em que elas se misturam.",
          strong:
            "Cada voz carrega um desejo ou um jeito de pensar. A distinção não depende de gíria decorativa.",
        },
      },
      {
        name: "Subtexto e pressão",
        points: world,
        kind: "objective",
        description:
          "Pelo menos uma coisa é dita de lado, recusada ou dita tarde demais. A conversa muda o que as pessoas podem fazer depois. Responder tudo com clareza na primeira fala esvazia o critério.",
        bands: {
          missing: "Tudo o que importa é dito de frente e resolvido na hora.",
          thin: "Há uma evasiva, mas ela não altera o resto da conversa.",
          working:
            "Uma fala indireta, uma recusa ou um atraso muda o que vem depois.",
          strong:
            "A pressão atravessa a cena. O leitor entende mais do que as personagens admitem, e o fim registra isso.",
        },
      },
      {
        name: "Gente atrás das falas",
        points: people,
        kind: "subjective",
        description:
          "Cada pessoa quer algo nesta cena. Pode mentir. A mentira precisa ser compreensível a partir do que o texto mostra. Ninguém deve servir só de porta-voz do tema. Há muitos jeitos de querer: o critério é se o desejo explica as falas.",
        bands: {
          missing: "As falas não revelam o que alguém quer.",
          thin: "O objetivo é anunciado, e as falas seguintes não o perseguem nem o escondem.",
          working:
            "Dá para inferir o que cada pessoa quer, com um trecho em que uma delas só empurra informação.",
          strong:
            "As estratégias de fala, inclusive o silêncio e a mentira, combinam com quem está falando.",
        },
      },
      {
        name: "Fala que parece fala",
        points: prose,
        kind: "subjective",
        description:
          "A conversa soa como conversa destas pessoas neste lugar. Interrupção e silêncio ajudam. Exposição disfarçada perde faixa quando as personagens já conheciam aqueles fatos. Uma fala mais literária vale se pertencer a quem a diz.",
        bands: {
          missing: "As falas são texto expositivo com aspas.",
          thin: "Há momentos de fala viva e blocos que só informam o leitor.",
          working:
            "A maior parte soa dita em voz alta. Uma fala importante está arrumada demais para quem a diz.",
          strong:
            "Ritmo, corte e silêncio parecem orais e específicos. O leitor ouve gente, não um resumo.",
        },
      },
    ],
  },
  {
    id: "rubric_suspense",
    title: "Cena de suspense",
    purpose:
      "Corrigir uma cena que retém e revela. Medo, mistério ou uma coisa quieta fora do lugar. A nota não exige monstro, reviravolta nem explicação. Exige controle do que o leitor sabe, e quando sabe.",
    howToRead:
      "Acompanhe a pergunta que a cena abre. O desconhecido pode continuar desconhecido. Uma explicação ordinária pode funcionar se o mal-estar tiver sido real no caminho. Punir a ausência de um susto final é erro de correção.",
    doNotPunish: [
      "Um final sem revelação, ou uma revelação pequena.",
      "Uma causa ordinária, se a cena fez o ordinário parecer errado.",
      "Medo contido, sem grito, perseguição ou violência.",
    ],
    criteria: [
      {
        name: "Aderência ao tema",
        points: fidelity,
        kind: "objective",
        description:
          "O texto entrega uma cena de suspense no contexto do tema. O lugar, o que está estranho e as exigências da cena alimentam a pergunta, em vez de serem cenário parado.",
        bands: {
          missing:
            "Não há pergunta, ameaça ou estranheza, ou a cena ignora o tema.",
          thin: "O clima é nomeado, mas uma exigência central do tema não entra.",
          working:
            "A cena cumpre o tema. Uma exigência aparece e pouco altera a tensão.",
          strong:
            "O contexto do tema é a fonte da pergunta e do que o leitor teme ou desconfia.",
        },
      },
      {
        name: "Uma pergunta aberta",
        points: shape,
        kind: "objective",
        description:
          "Algo está errado, faltando ou a caminho, e a cena mantém essa pergunta viva. Explicar tudo nas primeiras linhas, ou nunca chegar a formular o que inquieta, derruba o critério.",
        bands: {
          missing: "Não há pergunta, ou ela é respondida antes de existir.",
          thin: "A pergunta aparece uma vez e a cena segue sem voltar a ela.",
          working:
            "A pergunta permanece, com um trecho em que a tensão é só afirmada.",
          strong:
            "Cada novo detalhe complica a pergunta ou a reposiciona. O fim ainda deixa o leitor com ela, ou a transforma de propósito.",
        },
      },
      {
        name: "Informação controlada",
        points: world,
        kind: "objective",
        description:
          "O leitor aprende pelo que o ponto de vista nota, evita ou lê errado. Se houver revelação, ela muda o sentido de um detalhe anterior. Um dado novo sem efeito na leitura fica no meio da escala.",
        bands: {
          missing:
            "O texto despeja a explicação, ou esconde tudo sem dar o que notar.",
          thin: "Há pistas, mas elas não se relacionam com o que o leitor já viu.",
          working:
            "O que é revelado ou retido passa pelo ponto de vista. Uma informação importante chega solta.",
          strong:
            "Notar, evitar e errar a leitura conduzem a cena. O que o leitor sabe em cada momento parece escolhido.",
        },
      },
      {
        name: "Aposta humana",
        points: people,
        kind: "subjective",
        description:
          "Medo, curiosidade ou culpa estão numa pessoa, não só no clima. O desconhecido pode continuar desconhecido. O critério é se a pessoa tem algo a perder que a cena torna concreto. Há mais de um medo legítimo.",
        bands: {
          missing: "Ninguém tem o que perder. Só há atmosfera.",
          thin: "O medo é nomeado e não muda o que a pessoa faz.",
          working:
            "A pessoa age por causa do que teme, quer ou esconde, com um momento ainda genérico.",
          strong:
            "A aposta é específica. O leitor entende o que esta pessoa não pode se dar ao luxo de perder.",
        },
      },
      {
        name: "Atmosfera na prosa",
        points: prose,
        kind: "subjective",
        description:
          "O detalhe sensorial é escolhido. Repetição, silêncio e objeto comum podem carregar o mal-estar. Empilhar adjetivos não é suspense. Uma prosa clara e uma prosa mais lenta podem chegar à mesma faixa se o controle da informação estiver na frase.",
        bands: {
          missing:
            "Não há mundo sensorial, ou o texto só declara que a cena é tensa.",
          thin: "Os detalhes existem e não selecionam o que deve inquietar.",
          working:
            "Alguns objetos, sons ou silêncios trabalham. Outros enfeitam.",
          strong:
            "O que é descrito, repetido ou omitido sustenta a pergunta. A frase tem o tempo do medo ou da suspeita.",
        },
      },
    ],
  },
  {
    id: "rubric_turning_point",
    title: "Cena de virada",
    purpose:
      "Corrigir uma cena quieta em que uma pessoa muda de rumo. Perseguição e briga não são necessárias. O drama é uma decisão, um reconhecimento ou uma frase que não dá para desdizer. Quietude não é cena vazia.",
    howToRead:
      "Procure o antes e o depois. A virada pode ser pequena: uma mala fechada, uma chave deixada, uma ligação que não acontece. Ficar, ir embora ou adiar podem estar certos. O discurso que explica o tema não substitui a decisão.",
    doNotPunish: [
      "Uma decisão pequena, doméstica ou sem plateia.",
      "Ficar, sair ou não conseguir escolher, se o custo aparecer.",
      "Pouca ação externa, desde que objeto, corpo e lugar sustentem o momento.",
    ],
    criteria: [
      {
        name: "Aderência ao tema",
        points: fidelity,
        kind: "objective",
        description:
          "O texto entrega uma virada no contexto do tema. A situação, o objeto ou a frase que a cena pedia participam da decisão, em vez de decorar o cômodo.",
        bands: {
          missing: "Não há mudança de rumo, ou a cena ignora o tema.",
          thin: "Há uma decisão, mas uma exigência central do tema fica de fora.",
          working:
            "A cena cumpre o tema. Uma exigência aparece e pouco pesa na escolha.",
          strong:
            "O contexto do tema é o material da decisão. Sem ele, a virada não existiria.",
        },
      },
      {
        name: "Antes e depois",
        points: shape,
        kind: "objective",
        description:
          "A cena mostra a situação que tornou a mudança possível, o momento da mudança e uma consequência visível, mesmo pequena. Anunciar que a pessoa mudou, sem um gesto que o leitor veja, fica na faixa baixa.",
        bands: {
          missing: "Não há momento de mudança nem consequência.",
          thin: "A pessoa declara a decisão, e nada no mundo da cena se altera.",
          working:
            "Dá para ver o momento e uma consequência. Um dos dois ainda é resumido.",
          strong:
            "Situação, virada e consequência estão em sequência, e a consequência só faz sentido por causa da virada.",
        },
      },
      {
        name: "Vida concreta em volta da decisão",
        points: world,
        kind: "objective",
        description:
          "Objeto, lugar e corpo impedem a cena de ser só pensamento. Memória pode entrar se mudar o que as mãos fazem agora. Reflexão sem mundo sensível não completa o critério.",
        bands: {
          missing: "A cena é opinião ou memória solta, sem lugar nem gesto.",
          thin: "O cômodo é nomeado, mas os objetos não participam da escolha.",
          working:
            "Pelo menos um objeto ou gesto carrega a decisão. Outro trecho fica abstrato.",
          strong:
            "O que a pessoa pega, larga, guarda ou não consegue largar é a decisão.",
        },
      },
      {
        name: "Virada merecida",
        points: people,
        kind: "subjective",
        description:
          "A escolha combina com o que esta pessoa notou na cena. Uma surpresa vale se o texto plantou a pressão. Há mais de uma escolha digna: o critério é se o leitor consegue seguir por que foi esta. Um discurso que anuncia o tema vale menos do que uma decisão rastreável.",
        bands: {
          missing: "A virada não tem relação com o que a cena mostrou.",
          thin: "A escolha é possível, mas chega por uma explicação, não pelo que a pessoa percebeu.",
          working:
            "A pressão está plantada e a escolha responde a ela, com um salto ainda abrupto.",
          strong:
            "O leitor acompanha o custo e entende a escolha, mesmo se faria outra no lugar da personagem.",
        },
      },
      {
        name: "Prosa interior",
        points: prose,
        kind: "subjective",
        description:
          "O pensamento é específico e tem voz. A escrita não entrega um retrato de personalidade. Ela deixa o leitor dentro de um momento o bastante para sentir o custo. Frase longa e frase curta podem as duas funcionar.",
        bands: {
          missing: "Não há vida interior, ou ela é uma lista de traços.",
          thin: "Os pensamentos são genéricos e poderiam ser de outra pessoa.",
          working:
            "A voz interior é reconhecível, com uma passagem que explica o que já estava claro.",
          strong:
            "Pensamento, imagem e omissão têm a voz desta pessoa. O custo fica no jeito de perceber, não num slogan.",
        },
      },
    ],
  },
]
