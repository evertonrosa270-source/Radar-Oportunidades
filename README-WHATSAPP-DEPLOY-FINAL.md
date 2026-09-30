# RADAR — WhatsApp Business: versão final de integração

## O que foi corrigido

1. O servidor valida o Phone Number ID diretamente na Meta Graph API.
2. O servidor obtém o WABA vinculado ao Phone Number ID quando possível.
3. Ao ativar a integração, o servidor chama `/{WABA_ID}/subscribed_apps` para inscrever o aplicativo no WABA.
4. O webhook valida `x-hub-signature-256` quando `WHATSAPP_APP_SECRET` está configurado.
5. Mensagens recebidas são vinculadas ao usuário pelo `phone_number_id` e, como fallback, pelo WABA ID.
6. O ID da mensagem do WhatsApp é usado para impedir duplicação.
7. O número do remetente (`whatsapp_from`) é preservado na mensagem.
8. A tela de Oportunidades agora oferece um botão direto para abrir a conversa com o interessado, usando `https://wa.me/<numero>` e, ao responder, abre com o texto sugerido pré-preenchido.
9. Foi adicionado diagnóstico seguro em `/api/whatsapp-webhook-check`.

## Variáveis no Render

Configure no serviço do Render:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID` (pode ser preenchido com o WABA ID; a ativação também consegue resolver o WABA pelo Phone Number ID quando a Meta o retorna)
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_GRAPH_VERSION=v23.0`
- `WHATSAPP_WEBHOOK_URL=https://radar-oportunidades-xrn8.onrender.com/api/webhook/whatsapp`

Nunca coloque tokens ou App Secret no GitHub ou no chat.

## Configuração do webhook na Meta

No aplicativo da Meta, configure o callback para:

`https://radar-oportunidades-xrn8.onrender.com/api/webhook/whatsapp`

O Verify Token deve ser exatamente igual ao valor de `WHATSAPP_VERIFY_TOKEN` no Render.

Inscreva o campo `messages`.

Depois de publicar esta versão, entre no RADAR > WhatsApp Business > Ativar/Atualizar integração. Essa ação valida o número na Meta e tenta inscrever o app no WABA.

## Como validar ponta a ponta

1. Render: confirme que todas as variáveis existem.
2. Faça um novo deploy desta versão.
3. Meta: confirme callback + Verify Token + campo `messages`.
4. RADAR: informe o Phone Number ID e WABA ID e clique em Ativar/Atualizar.
5. Clique em `Testar conexão com a Meta`.
6. Envie uma NOVA mensagem de um telefone externo para o número WhatsApp Business.
7. Abra Oportunidades.
8. A mensagem deve aparecer com `source=whatsapp` e o telefone do remetente fica disponível para o botão de contato.

### Importante

Nenhum software pode garantir entrega de webhook se a configuração externa da Meta estiver incorreta ou se o token não tiver permissões suficientes. Esta versão elimina os pontos de falha que estavam dentro do código e torna a falha externa visível no diagnóstico, mas a inscrição do webhook e as permissões da Meta precisam existir no ambiente real.
