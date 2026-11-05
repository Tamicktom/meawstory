# 0A-3 · Confirmar retenção e uso de dados pela OpenAI

**Fase 0 · Etapa A — Decisões** · Tipo: Decisão · [Card pai](../00-card-pai.md)

## Objetivo

Embasar as promessas públicas sobre o tratamento das cenas enviadas para leitura.

## Escopo

- Confirmar os termos vigentes de retenção e uso dos dados enviados à OpenAI.
- Registrar o que pode ser afirmado na landing, nos termos e na política de privacidade.
- Não prometer ausência de retenção ou de uso sem confirmação documental.

## Critérios de conclusão

- Há uma conclusão registrada e referências para orientar os textos públicos.

## Resultado

**Conclusão em 2026-11-04:** a OpenAI não usa as cenas enviadas pela API para treinar modelos, salvo adesão explícita ao compartilhamento de dados. Ela retém o conteúdo por até 30 dias para monitorar abuso, e por mais tempo quando a lei ou a proteção contra danos exigir. Não há retenção zero sem aprovação prévia da OpenAI.

### O que mudou no código

A leitura chama a Responses API (`/v1/responses`) sem definir `store`, e o padrão dessa API guarda a resposta por pelo menos 30 dias, sem prazo final na documentação. **Decisão:** enviar `store: false` em `workflows/correction.ts`. Com isso, resta a retenção dos logs de abuso.

As respostas geradas antes dessa mudança continuam sujeitas ao padrão.

### O que os textos públicos podem afirmar

- A cena é enviada à OpenAI para gerar a leitura.
- Pelos termos da API, esse conteúdo não é usado para treinar ou melhorar os modelos da OpenAI.
- A OpenAI pode mantê-lo por até 30 dias para monitorar abuso, ou por mais tempo quando a lei ou a proteção contra danos exigir.
- A OpenAI não reivindica a propriedade do conteúdo enviado. A promessa “Seu texto continua seu” ainda precisa constar dos termos do próprio Meawstory.

**Texto de referência:** “Para gerar a leitura, sua cena é enviada à OpenAI. Pelos termos da API, ela não é usada para treinar modelos. A OpenAI pode mantê-la por até 30 dias para monitorar abuso, ou por mais tempo quando a lei ou a proteção contra danos exigir.”

### O que não pode ser afirmado

- Que a OpenAI não retém nada, ou que apaga a cena logo após a leitura.
- Que ninguém na OpenAI pode ver o conteúdo. A documentação prevê revisão humana em casos de segurança.
- Que os dados ficam no Brasil. O país não aparece nas regiões de residência de dados.
- Que o tratamento está em conformidade com a LGPD, sem revisão jurídica. O DPA trata expressamente de EEE, Suíça, Reino Unido e EUA, e não cita Brasil nem LGPD.

### Confirmação operacional para 0E-1

**2026-11-05:** a pessoa responsável pelo projeto confirmou que o compartilhamento de entradas e saídas para melhoria dos modelos está desativado no projeto da OpenAI usado em produção. Essa confirmação foi fornecida na implementação da etapa E; não foi inferida do código. A documentação oficial de controles de dados foi consultada novamente nessa data e mantém a regra de não treinamento por padrão, a exceção de adesão explícita e a retenção para monitoramento de abuso.

Na etapa E, os termos passam a destinar o teste a pessoas com 18 anos ou mais e descrevem a autorização de processamento ao pedir a leitura. A política cobre banco, Workflow, autenticação e e-mails; explicita que o prazo do Workflow em produção ainda não foi confirmado e não promete exclusão imediata. Os links ficam disponíveis antes do cadastro e dos envios.

### Cuidados operacionais mantidos

- **Compartilhamento de dados:** manter desativado. Conferir novamente ao trocar de organização ou projeto; a afirmação pública sobre treino depende disso.
- **Idade e autorização:** o teste foi limitado a maiores de 18 anos, com declaração ao criar a conta e autorização ao pedir a leitura. Não há verificação documental de idade nem registro versionado de aceite. O contrato atribui ao Meawstory obter os consentimentos necessários (seção 3.2), e o DPA atribui a ele as decisões de configuração, como retenção (seção 3.3).
- **Outros lugares com a cena:** a política de privacidade cobre o banco e o Workflow, que persiste as entradas dos passos e seus resultados. O texto da cena passa por esses passos. A retenção do Workflow em produção ainda precisa ser confirmada; não há promessa pública de prazo ou de exclusão imediata desses registros.
- **Revisão jurídica:** este registro resume documentos públicos e não substitui uma revisão dos termos antes do teste com pessoas reais.
- **Validade:** a OpenAI pode atualizar os termos (seção 16.13). Conferir de novo antes de publicar e ao trocar de modelo ou de endpoint.

### Referências

Consultadas em 2026-11-04.

- [Data controls in the OpenAI platform](https://developers.openai.com/api/docs/guides/your-data): treino, logs de abuso, `store`, retenção zero e residência de dados.
- [OpenAI Services Agreement, v.010126](https://cdn.openai.com/osa/openai-services-agreement.pdf): seções 3.2, 3.3, 4.1, 4.2, 11.3 e 16.13.
- [OpenAI Data Processing Addendum, v.010126](https://cdn.openai.com/pdf/openai-data-processing-addendum.pdf): seções 2.11, 3.3 e 4.
- [Lista de suboperadores](https://openai.com/policies/sub-processor-list/): vista apenas por resultado de busca, porque a página recusou o acesso direto.
- [Compartilhamento de dados com a OpenAI](https://help.openai.com/en/articles/10306912-sharing-feedback-evaluation-and-fine-tuning-data-and-api-inputs-and-outputs-with-openai): vista apenas por resultado de busca, pelo mesmo motivo.
- [Países atendidos](https://developers.openai.com/api/docs/supported-countries): o Brasil está na lista.
- Documentação do Workflow em `node_modules/workflow/docs`: persistência dos passos.
