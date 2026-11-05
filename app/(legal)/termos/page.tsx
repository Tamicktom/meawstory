import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Termos de uso | Meawstory",
  description:
    "Condições para treinar escrita e receber leituras por IA no Meawstory.",
}

export default function TermsPage() {
  return (
    <>
      <h1>Termos de uso</h1>
      <p>
        O Meawstory é um espaço de treino de ficção mantido pela equipe
        Meawstory. Você escolhe um exercício, escreve uma cena e recebe uma
        leitura por inteligência artificial para orientar sua revisão. Esta
        versão está em teste com pessoas convidadas.
      </p>
      <h2>Quem pode usar e como funciona a conta</h2>
      <p>
        Neste teste, o uso é destinado a pessoas com 18 anos ou mais. Ao criar
        uma conta, você declara atender a essa regra e aceitar estes termos. Use
        um e-mail ao qual tenha acesso, proteja sua senha e não use a conta de
        outra pessoa. A confirmação do e-mail é necessária para iniciar uma
        leitura; você pode entrar e salvar sua cena antes de confirmar.
      </p>
      <h2>Seu texto continua seu</h2>
      <p>
        Você mantém os direitos sobre as cenas que escreve. O Meawstory não
        assume a autoria nem a propriedade dos seus textos. Ao enviar uma cena,
        você autoriza seu armazenamento e processamento pelo Meawstory e pelos
        fornecedores descritos na política de privacidade, apenas para operar o
        serviço, gerar a leitura e manter seu histórico. Essa autorização não
        permite publicar ou comercializar sua cena.
      </p>
      <p>
        Envie somente conteúdo que você tem direito de usar e compartilhar. Não
        inclua dados sensíveis, informações confidenciais ou dados pessoais de
        outras pessoas sem autorização. Não use o serviço para violar direitos,
        praticar atos ilegais ou tentar comprometer seu funcionamento.
      </p>
      <h2>Leitura por inteligência artificial</h2>
      <p>
        Ao pedir uma leitura, você autoriza o envio da sua cena e dos critérios
        do exercício à OpenAI. A leitura pode errar, interpretar mal um trecho
        ou sugerir algo que não serve à sua intenção. A pontuação é uma
        referência de treino: não é uma avaliação profissional nem define o
        valor literário do texto. Cabe a você decidir o que revisar.
      </p>
      <p>
        Pelos termos da API, o conteúdo enviado não é usado para treinar
        modelos. A OpenAI pode mantê-lo por até 30 dias para monitorar abuso, ou
        por mais tempo quando a lei ou a proteção contra danos exigir. Os demais
        locais de armazenamento e seus limites estão na{" "}
        <Link href="/privacidade">Política de privacidade</Link>.
      </p>
      <h2>Limites e disponibilidade</h2>
      <p>
        Cada cena precisa ter entre 100 e 2.000 palavras para receber uma
        leitura. Cada pessoa pode iniciar até 10 leituras em um período móvel de
        24 horas e até 3 em 10 minutos. Tentativas que falham não consomem esses
        limites. O produto pode apresentar falhas ou ficar indisponível durante
        o teste. Guarde uma cópia dos textos importantes fora do Meawstory.
      </p>
      <h2>Dados, dúvidas e encerramento do teste</h2>
      <p>
        Leia a <Link href="/privacidade">Política de privacidade</Link> antes de
        cadastrar sua conta ou enviar uma cena. Para dúvidas, problemas ou
        pedidos sobre seus dados, fale com a equipe pelo mesmo canal em que
        recebeu o convite para o teste. Os e-mails automáticos usam um remetente
        que não recebe respostas.
      </p>
      <p>
        Você pode parar de usar o produto a qualquer momento. A interface ainda
        não oferece exclusão de conta ou exportação de dados; esses pedidos
        devem ser feitos à equipe pelo canal do convite.
      </p>
      <h2>Atualizações destes termos</h2>
      <p>
        Mudanças serão publicadas nesta página com uma nova data. Se uma mudança
        afetar o uso das suas cenas ou o tratamento dos seus dados, a equipe
        avisará pelo canal do teste antes de aplicá-la aos próximos envios.
      </p>
    </>
  )
}
