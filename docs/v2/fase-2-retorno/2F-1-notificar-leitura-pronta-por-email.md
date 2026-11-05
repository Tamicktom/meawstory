# 2F-1 · Notificar leitura pronta por e-mail

**Fase 2 · Etapa F — Notificações** · Tipo: Implementação · [Card pai](../00-card-pai.md)

## Objetivo
Trazer a pessoa de volta quando houver uma ação de valor disponível.

## Escopo
- Enviar e-mail pelo Resend quando uma leitura for concluída.
- Usar remetente e identidade já configurados na Fase 0.
- Incluir link direto para a leitura, respeitando autenticação e retorno ao destino.
- Não enviar e-mail para tentativas com falha.
- Evitar notificações duplicadas para a mesma leitura.

## Critérios de conclusão
- Uma leitura concluída gera no máximo uma notificação e o link abre a leitura correta após entrar.

## Dependências
- [0B-2 · Redirecionar acesso e retomar o destino](../fase-0-base/0B-2-redirecionar-acesso-e-retomar-destino.md)
- [0B-4 · Configurar o envio de e-mails com Resend](../fase-0-base/0B-4-configurar-envio-de-emails-com-resend.md)
