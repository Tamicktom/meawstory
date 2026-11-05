//* Local imports
import type { ThemeDefinition } from "@/database/seed/render-theme"

export const themeDefinitions: ThemeDefinition[] = [
  {
    id: "theme_roof_gap",
    title: "O vão entre os telhados",
    rubricId: "rubric_action",
    situation:
      "Chove desde o meio-dia. Duas pessoas adultas estão num telhado, três andares acima de uma rua estreita. Uma delas carrega um envelope que a outra precisa ter antes de amanhecer. Elas não são estranhas: existe uma história entre as duas, e você pode insinuá-la sem explicá-la. O próximo telhado dá para um pulo e também dá para um erro. A escada de incêndio do outro prédio é a única descida que não é o caminho por onde subiram.",
    alreadyTrue: [
      "Quem está com o envelope não quer entregá-lo.",
      "A outra pessoa é mais rápida no chão plano e pior com altura.",
      "Alguém lá embaixo já as viu e ainda não chegou ao telhado.",
    ],
    mustInclude: [
      "A travessia de pelo menos duas superfícies diferentes, como telhado, beiral, andaime, escada ou telha.",
      "Um momento em que o plano muda por causa da chuva, do vão ou da pessoa lá embaixo.",
      "O envelope ainda importando no fim, tenha mudado de mãos ou não.",
    ],
    youDecide:
      "Quem são essas pessoas, o que há no envelope, se alguém pula, escorrega ou se recusa a pular, e como a cena termina. Fique num ponto de vista ou mude. Não pare antes de alguém ter que escolher.",
    length:
      "Uma cena, entre 400 e 900 palavras. Pare quando a escolha tiver pousado. Não escreva prólogo nem epílogo.",
  },
  {
    id: "theme_last_blocks",
    title: "Os três quarteirões finais",
    rubricId: "rubric_action",
    situation:
      "Fim de tarde numa rua cheia. A pessoa que você acompanha tem quatro minutos para chegar a uma esquina onde alguém espera, e essa alguém não fica depois do farol que combinaram. A rua esconde e também atrasa: uma procissão, um caminhão atravessado, um protesto ou uma feira, você escolhe o obstáculo. Uma segunda pessoa adulta tenta impedir a primeira, ou tenta chegar junto. Elas se veem em alguns trechos e se perdem em outros.",
    alreadyTrue: [
      "Atrasar tem um custo real, e as duas sabem qual é.",
      "Nenhuma das duas pode simplesmente avisar. O telefone está sem bateria, perdido ou é perigoso usar.",
      "O caminho que tinham planejado fechou.",
    ],
    mustInclude: [
      "Movimento num lugar público, com gente que não faz parte da corrida e mesmo assim atrapalha.",
      "Uma escolha que ganha tempo e custa outra coisa: uma dívida, uma mentira, um objeto ou a confiança de alguém.",
      "Uma chegada, um atraso consumado ou a decisão de parar de correr. A cena precisa pousar numa dessas três.",
    ],
    youDecide:
      "A cidade, a relação entre as pessoas, o que significa esperar na esquina e quem corre atrás de quem. O obstáculo pode ser cômico ou ameaçador. Mantenha a cena física.",
    length:
      "Uma cena, entre 400 e 900 palavras. O relógio da cena é curto. Não conte o dia inteiro.",
  },
  {
    id: "theme_narrow_kitchen",
    title: "A cozinha estreita",
    rubricId: "rubric_fight",
    situation:
      "De noite, numa cozinha pequena demais para duas pessoas adultas brigarem. Elas se conhecem bem. Não há espada nem arma de fogo no cômodo. Há bancada, pia, um bloco de facas ou a ausência dele, cadeiras, uma panela ainda quente se você quiser, e uma porta que abre para dentro. Uma delas veio para ir embora. A outra não deixa isso acontecer sem uma resposta. A discussão de palavras já falhou. A cena começa no primeiro empurrão, ou no instante imediatamente anterior.",
    alreadyTrue: [
      "Elas já brigaram com palavras nesta noite, e isso não mudou nada.",
      "Uma é mais forte. A outra conhece melhor a cozinha.",
      "Pode haver uma terceira pessoa dormindo no cômodo ao lado. Se houver, as duas sabem.",
    ],
    mustInclude: [
      "Uma luta que use o cômodo. Pelo menos um objeto muda o que alguém consegue fazer.",
      "Dor, cansaço ou hesitação alterando o gesto seguinte.",
      "Uma parada: alguém desiste, não consegue continuar, ou escolhe não desferir o último golpe. Não escreva uma morte, a menos que o peso dela tenha sido construído. A briga pode terminar menor do que isso e ainda assim acabar.",
    ],
    youDecide:
      "Quem elas são uma para a outra, do que se trata a partida, e o quanto a violência é feia ou contida. Permaneça dentro do apartamento.",
    length:
      "Uma cena, entre 400 e 900 palavras. Fique na luta e no que ela custa. Não transforme a cena num processo.",
  },
  {
    id: "theme_agreed_bout",
    title: "O combate combinado",
    rubricId: "rubric_fight",
    situation:
      "Uma briga marcada, num lugar com regra: um ringue, um pátio, uma academia depois do expediente ou uma clareira aonde as duas pessoas adultas foram de propósito. Há alguns espectadores, uma única pessoa fazendo às vezes de árbitro, ou ninguém. Elas concordaram com isso. Concordar não significa querer a mesma coisa. Uma está ali para vencer limpo. A outra está ali porque perder, ou recusar, custaria mais do que apanhar.",
    alreadyTrue: [
      "Existe uma regra que as duas conhecem: sem punho fechado, o primeiro a sair do risco, até alguém permanecer no chão, ou um número combinado de trocas.",
      "Uma delas treinou mais.",
      "Algo fora do combate será diferente amanhã conforme o resultado, e as duas sabem o quê.",
    ],
    mustInclude: [
      "Pelo menos três trocas distintas. A segunda precisa ser diferente por causa da primeira.",
      "Uma quebra da regra, ou um momento em que alguém poderia quebrá-la e decide.",
      "A plateia ou a testemunha, se existir, afetando quem luta. Se não houver ninguém, o silêncio precisa pesar.",
    ],
    youDecide:
      "A época, o tipo de luta, a aposta e o resultado. Uma vitória limpa, uma vitória roubada e uma recusa podem encerrar a cena.",
    length:
      "Uma cena, entre 500 e 1000 palavras. A regra precisa ficar clara para o leitor sem um manual.",
  },
  {
    id: "theme_under_the_awning",
    title: "Debaixo do toldo",
    rubricId: "rubric_romance",
    situation:
      "A noite deu errado em público: um jantar que desabou, uma festa a que não deviam ter ido, um trem que perderam juntas. Agora duas pessoas adultas estão debaixo de um toldo, ou na boca de uma porta, esperando o tempo passar. Quase se encostam porque o espaço seco é pequeno. Não são um casal resolvido. Podem ter sido, podem estar no começo, ou esta pode ser a única noite. Uma veste o casaco da outra, ou segura o casaco e não o veste.",
    alreadyTrue: [
      "Algo foi dito mais cedo nesta noite e ainda não teve resposta.",
      "Uma delas tem um lugar para estar. A outra não tem, ou finge que não.",
      "Ninguém vem interromper enquanto a cena durar.",
    ],
    mustInclude: [
      "Atenção à outra pessoa por um detalhe físico pequeno, não por um discurso sobre sentimento.",
      "Um movimento de aproximação e um de afastamento, em qualquer ordem. O beijo pode acontecer, quase acontecer ou ser recusado.",
      "No fim, uma delas deixa o próximo passo claro, mesmo que a outra não aceite.",
    ],
    youDecide:
      "A história entre elas, o que foi dito no jantar ou na festa, e se a cena é terna, engraçada ou áspera. Explicitar é opcional. As duas continuam com vontade própria.",
    length:
      "Uma cena, entre 400 e 800 palavras. Fique debaixo do toldo. Não reconte a noite inteira.",
  },
  {
    id: "theme_two_am_glass",
    title: "O copo às duas da manhã",
    rubricId: "rubric_romance",
    situation:
      "Uma cozinha, mais tarde do que as duas pessoas adultas pretendiam ficar acordadas. Uma parte de manhã: outra cidade, uma turnê, um casamento que não é este, um emprego, uma decisão já tomada. A outra lava um único copo, seca, ou não consegue largá-lo. O que elas são uma para a outra não tem um nome arrumado. A casa está quieta. Uma mala já está na porta, ou ainda não foi feita.",
    alreadyTrue: [
      "A partida é real. A cena não pode cancelá-la com um discurso, a menos que você mostre o custo de ficar e ainda assim escolha.",
      "Elas já se tocaram antes, ou nunca se tocaram. Escolha uma opção e respeite-a.",
      "Há um objeto ordinário na cozinha que pertence às duas, ou que uma está prestes a deixar para trás.",
    ],
    mustInclude: [
      "Detalhe doméstico usado como intimidade ou como distância.",
      "Algo que quase é dito duas vezes antes de ser dito, ou antes de quem ia dizer escolher o silêncio.",
      "Um fim que muda a manhã, mesmo de leve: uma promessa, uma recusa, uma piada que não é só piada, uma mão que fica ou que solta.",
    ],
    youDecide:
      "A relação, o motivo da partida e o quanto elas admitem. A cena pode ser quieta. Quieta ainda precisa de uma virada.",
    length:
      "Uma cena, entre 400 e 900 palavras. Não avance até o aeroporto, a estação ou o dia seguinte.",
  },
  {
    id: "theme_traffic",
    title: "O trânsito que não anda",
    rubricId: "rubric_dialogue",
    situation:
      "Duas pessoas adultas dentro de um carro. O trânsito parou e não vai abrir antes de elas chegarem ao lugar para onde já estão atrasadas: um balcão de hospital, um jantar de família, a calçada de um aeroporto, uma escola. O assunto que elas vinham evitando cabe nesta viagem e pode não caber depois que descerem. O rádio pode estar ligado. Uma delas pode insistir num caminho alternativo que as duas sabem que não existe.",
    alreadyTrue: [
      "O trânsito não as coloca em perigo. A pressão é a conversa.",
      "Uma sabe de uma coisa que a outra não sabe, ou as duas sabem e só uma vai dizer.",
      "Sair do carro é possível, e significaria alguma coisa. Pelo menos uma delas considera isso.",
    ],
    mustInclude: [
      "Diálogo conduzindo a cena. A ação fica limitada ao carro: mãos, retrovisor, buzina, freio de mão, um olhar.",
      "Uma frase que acerta mais forte do que quem falou pretendia.",
      "Uma mudança até o trânsito andar, ou até uma delas decidir que não importa se ele anda.",
    ],
    youDecide:
      "Quem são, qual é o segredo ou a acusação, e se chegam ainda se falando. Deixe cada uma soar como ela mesma. Elas podem se interromper.",
    length:
      "Uma cena, entre 400 e 900 palavras. Quase tudo deve caber em fala e em gesto pequeno.",
  },
  {
    id: "theme_everything_but_the_dead",
    title: "Tudo, menos quem morreu",
    rubricId: "rubric_dialogue",
    situation:
      "Depois de um funeral, ou alguns dias depois, duas pessoas adultas que já foram próximas se sentam num lugar em que podem ser ouvidas se não tiverem cuidado: a cozinha durante a recepção, um corredor de escada, o estacionamento, um banco lá fora. Todo o resto fala de quem morreu. Estas duas falam em volta. Têm uma conta antiga, mais velha do que a morte, e a morte tornou mais grosseiro continuar ignorando.",
    alreadyTrue: [
      "Elas amaram, ou falharam, a mesma pessoa de jeitos diferentes.",
      "Existe uma história sobre quem morreu em que elas não concordam.",
      "Esta é a primeira vez que ficam a sós desde antes da morte.",
    ],
    mustInclude: [
      "Uma conversa que circula e, uma vez, para de circular.",
      "Uma memória concreta de quem morreu, usada para defender, acusar ou consolar: um lugar, um objeto, uma frase que essa pessoa dizia.",
      "Uma delas pede alguma coisa. A outra responde, mesmo que a resposta seja não.",
    ],
    youDecide:
      "A relação, como a pessoa morreu e o quanto elas conseguem ser honestas. Doença, acidente ou velhice bastam. A cena não precisa reconciliá-las. Não descreva a violência da morte.",
    length:
      "Uma cena, entre 500 e 1000 palavras. O funeral pode ficar fora do quadro. A conversa é a cena.",
  },
  {
    id: "theme_light_left_on",
    title: "A luz que devia estar apagada",
    rubricId: "rubric_suspense",
    situation:
      "Uma pessoa adulta chega em casa, ou de volta a um quarto que conhece, e uma luz está acesa que ela apagou. Nada parece ter sumido. O lugar é ordinário: um apartamento, a casa da infância, um quarto de hotel em que ela já dormiu. É tarde. Ela pode ir embora, chamar alguém ou entrar mais. A cena começa na porta.",
    alreadyTrue: [
      "Ela tem certeza de que apagou aquela luz. Leve essa certeza a sério, e deixe também que ela possa estar errada.",
      "Há um som que não pertence ao lugar, e ele pode ter uma causa ordinária.",
      "Alguém de quem ela gosta está lá dentro, deve chegar mais tarde, ou não faz parte desta noite. Escolha, e não traga um resgate de fora da cena.",
    ],
    mustInclude: [
      "Uma leitura lenta do cômodo. Um objeto comum pode estar errado por um palmo.",
      "Um momento em que a explicação da personagem falha, ou quase funciona.",
      "Um fim que responde a um medo e deixa outro aberto. Você não precisa mostrar o que, se é que havia algo, estava no quarto.",
    ],
    youDecide:
      "Se há mais alguém, se a ameaça é humana e o quanto a personagem confia na própria memória. O mal-estar pode continuar quieto.",
    length:
      "Uma cena, entre 400 e 900 palavras. Comece na porta e não explique o mistério num parágrafo final de revelação obrigatória.",
  },
  {
    id: "theme_knows_the_house",
    title: "Quem conhece a casa",
    rubricId: "rubric_suspense",
    situation:
      "Duas pessoas adultas estão dentro de uma casa. Uma mora ali ou cresceu ali. A outra não devia estar dentro. O ponto de vista pode ser de qualquer uma das duas. A casa tem uma planta que o leitor deve aprender pelo movimento: qual porta emperra, qual degrau reclama, onde o interruptor não está. Está escuro o bastante para o conhecimento da casa valer mais do que a força.",
    alreadyTrue: [
      "Quem entrou sem direito quer uma coisa específica: um objeto, uma pessoa, um cômodo ou uma saída. Escolha uma.",
      "Quem conhece a casa não sabe, durante a maior parte da cena, onde a outra está.",
      "O telefone não serve, está fora de alcance ou já é um risco.",
    ],
    mustInclude: [
      "Movimento que dependa de quem conhece os cômodos.",
      "Um erro de quem deveria ter a vantagem.",
      "Um quase encontro, ou um encontro, que mude quem está caçando. Você não precisa escrever uma captura nem uma fuga se a virada em si pousar.",
    ],
    youDecide:
      "Por que a pessoa entrou, se elas se conhecem e o quanto a cena se torna violenta. A suspeita pode trabalhar tanto quanto a corrida.",
    length:
      "Uma cena, entre 500 e 1000 palavras. Deixe a planta da casa aparecer pelo uso, não por uma descrição de planta baixa.",
  },
  {
    id: "theme_what_stays_in_the_bag",
    title: "O que fica na mala",
    rubricId: "rubric_turning_point",
    situation:
      "Uma pessoa adulta faz, desfaz ou refaz uma mala em cima de uma cama, no chão ou numa cadeira. Ela devia partir em breve: hoje, hoje à noite, ou dentro de uma hora. O motivo é prático e também não é. Alguma coisa no quarto continua sendo pegada e devolvida ao lugar. Ninguém mais precisa estar presente. Se houver alguém na porta, essa pessoa não decide.",
    alreadyTrue: [
      "Uma passagem, uma chave, um emprego ou uma pessoa está esperando, e perder essa chance tem custo.",
      "Há um objeto que não pertence a quem viaja, ou que essa pessoa nunca deveria levar.",
      "A mala já foi feita uma vez. Esta é a segunda.",
    ],
    mustInclude: [
      "A decisão acontecendo pelo que entra na mala e pelo que fica.",
      "Uma memória só se ela mudar o que as mãos fazem em seguida.",
      "Um fim em que a pessoa parte, fica ou para na porta. O leitor precisa saber qual foi a escolha e o que ela custou, sem um discurso que explique o tema.",
    ],
    youDecide:
      "Para onde ela iria, o que está deixando e se a escolha é corajosa, egoísta ou as duas coisas. Permaneça neste quarto.",
    length:
      "Uma cena, entre 400 e 800 palavras. O drama cabe no que é guardado e no que é deixado.",
  },
  {
    id: "theme_key_on_the_table",
    title: "A chave na mesa",
    rubricId: "rubric_turning_point",
    situation:
      "Uma chave está numa mesa entre duas pessoas adultas, ou entre uma pessoa e uma cadeira vazia. Ela abre um lugar que foi das duas: um apartamento, um ateliê, um carro, um portão. Uma veio devolvê-la. Devolver era para ser simples. A outra coisa que veio dizer, ou evitar dizer, não cabe no mesmo minuto. É de dia. A cena deve parecer ordinária até deixar de ser.",
    alreadyTrue: [
      "A relação já mudou antes desta cena. A chave está atrasada.",
      "Uma delas aceitaria a chave de volta se fosse oferecida. A outra não tem certeza de que quer isso.",
      "Além da chave, há uma tarefa ou um objeto pequeno, como correspondência, uma planta ou um casaco, que dá às mãos o que fazer.",
    ],
    mustInclude: [
      "A chave sendo tocada, movida ou deixada quieta de um jeito que o leitor veja.",
      "Uma frase que não dá para desdizer, ou uma frase que alguém chega a formular e troca por uma menor.",
      "Uma escolha sobre a chave que combine com a escolha sobre a pessoa. Elas só podem divergir se a cena mostrar a contradição de propósito.",
    ],
    youDecide:
      "O que elas foram uma para a outra, quem terminou e se a chave muda de mãos. Reconciliação é possível. Uma despedida limpa e pouco gentil também. Sustente a que você escolher.",
    length:
      "Uma cena, entre 400 e 900 palavras. Não recomece o relacionamento do zero. A chave chega tarde.",
  },
]
