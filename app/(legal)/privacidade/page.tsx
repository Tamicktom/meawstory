import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de privacidade | Meawstory",
  description:
    "Quais dados o Meawstory guarda e como suas cenas são processadas para gerar leituras por IA.",
}

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de privacidade</h1>
      <p>
        Esta política descreve como a equipe Meawstory trata os dados na versão
        de teste por convite. Ela se aplica ao cadastro, ao acesso à conta e às
        cenas enviadas para leitura. As condições de uso estão nos{" "}
        <Link href="/termos">Termos de uso</Link>.
      </p>
      <h2>Dados que guardamos e para quê</h2>
      <ul>
        <li>
          Nome, e-mail, estado de confirmação do e-mail e senha em formato
          protegido por hash: para criar a conta e autenticar você. A senha não
          é guardada em texto legível.
        </li>
        <li>
          Sessões, endereço IP, informações do navegador, datas e tokens de
          acesso, confirmação e recuperação: para manter o acesso e permitir a
          confirmação do e-mail e a troca de senha.
        </li>
        <li>
          Cenas, exercício escolhido, leituras, pontuações, critérios aplicados
          e datas: para gerar a leitura e permitir que você reencontre seu
          histórico. Cada tentativa preserva uma cópia da cena e dos critérios
          usados naquele momento.
        </li>
        <li>
          Registros técnicos de execução e falhas: para processar as leituras e
          investigar problemas de funcionamento.
        </li>
      </ul>
      <h2>Para onde vai sua cena</h2>
      <p>
        A cena fica no banco de dados do Meawstory vinculada à sua conta. Quando
        você pede uma leitura, seu conteúdo e os critérios do exercício são
        enviados à OpenAI. O fluxo de processamento usa o Workflow, que também
        persiste entradas e resultados das etapas, incluindo a cena e a leitura.
        O armazenamento e a hospedagem usados para operar esses serviços também
        processam esses dados.
      </p>
      <p>
        Nome, e-mail e senha da sua conta não são incluídos no pedido de leitura
        à OpenAI. Porém, qualquer dado que você escrever dentro da própria cena
        será enviado com ela. Evite dados sensíveis, segredos e informações
        pessoais de terceiros.
      </p>
      <h2>Uso e retenção pela OpenAI</h2>
      <p>
        Pelos termos da API, os dados enviados não são usados para treinar ou
        melhorar os modelos, salvo adesão explícita ao compartilhamento. O
        compartilhamento de entradas e saídas para essa finalidade está
        desativado no projeto usado pelo Meawstory.
      </p>
      <p>
        Os pedidos atuais desativam o armazenamento da resposta na Responses
        API. Isso não elimina os registros de monitoramento de abuso: a OpenAI
        pode guardar conteúdo por até 30 dias, ou por mais tempo quando a lei ou
        a proteção contra danos exigir. Pode haver revisão humana em situações
        de segurança. Não oferecemos retenção zero nem garantia de processamento
        ou armazenamento no Brasil.
      </p>
      <p>
        Respostas geradas antes de desativarmos esse armazenamento podem
        permanecer sob a configuração anterior, que prevê armazenamento por pelo
        menos 30 dias. Consulte também a{" "}
        <a href="https://developers.openai.com/api/docs/guides/your-data">
          documentação de controles de dados da OpenAI
        </a>
        .
      </p>
      <h2>Por quanto tempo mantemos os outros dados</h2>
      <p>
        A versão atual mantém sua conta, cenas e leituras para permitir o acesso
        e a consulta ao histórico, sem um prazo automático de exclusão definido.
        Retirar uma cena de circulação não apaga necessariamente suas leituras e
        cópias históricas. O prazo de retenção dos registros do Workflow em
        produção ainda não está confirmado. Por isso, não prometemos eliminação
        imediata ou um prazo único que cubra o banco, o processamento, registros
        técnicos e eventuais cópias de segurança.
      </p>
      <h2>E-mails e armazenamento no navegador</h2>
      <p>
        Em produção, o Resend recebe o endereço de e-mail e o conteúdo das
        mensagens de confirmação de e-mail e recuperação de senha, que podem
        incluir seu nome e links de acesso. Suas cenas não fazem parte dessas
        mensagens. No desenvolvimento e nos testes, as mensagens ficam em
        arquivos locais, sem envio pelo Resend.
      </p>
      <p>
        Usamos cookies de sessão para manter sua autenticação e armazenamento no
        navegador para a preferência de aparência. Esses recursos permitem o
        acesso à conta e lembram sua escolha de tema.
      </p>
      <h2>Acesso aos dados e pedidos à equipe</h2>
      <p>
        Suas cenas e leituras não são publicadas em um catálogo aberto. A equipe
        e os fornecedores podem precisar acessar dados para operar o serviço,
        prestar suporte ou investigar falhas e abuso.
      </p>
      <p>
        Para pedir informações, correção, uma cópia ou exclusão dos seus dados,
        entre em contato com a equipe Meawstory pelo mesmo canal em que recebeu
        o convite. Ainda não existe uma área de exportação ou exclusão de conta
        na interface. A equipe precisa confirmar sua identidade e verificar o
        alcance do pedido, incluindo registros mantidos pelos fornecedores. Não
        envie senhas nesse contato e não responda aos e-mails automáticos, cujo
        remetente não recebe respostas.
      </p>
      <h2>Atualizações desta política</h2>
      <p>
        Publicaremos alterações nesta página com uma nova data. Mudanças no uso
        das cenas ou nos fornecedores que as processam serão comunicadas pelo
        canal do teste antes de valerem para os próximos envios.
      </p>
    </>
  )
}
