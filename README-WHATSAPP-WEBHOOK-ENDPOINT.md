# Correção do endereço padrão do webhook WhatsApp

O servidor agora usa por padrão o endpoint público do backend no Render:

`https://radar-oportunidades-xrn8.onrender.com/api/webhook/whatsapp`

Se `WHATSAPP_WEBHOOK_URL` estiver definida nas variáveis do Render, ela tem prioridade sobre esse padrão. Confirme que o valor configurado é exatamente o endpoint público acima.

## Configuração obrigatória na Meta

No painel Meta for Developers, abra o aplicativo usado pela Cloud API e vá à configuração do WhatsApp/Webhooks. Configure a URL de callback para o endpoint acima, use o mesmo valor de `WHATSAPP_VERIFY_TOKEN` do Render e conclua a verificação. Depois, inscreva o campo `messages` nos eventos do webhook.

O endpoint de callback configurado na Meta é independente da inscrição do aplicativo no WABA. A mensagem “Integração validada” não prova, sozinha, que a callback está configurada nem que eventos estão sendo entregues.
