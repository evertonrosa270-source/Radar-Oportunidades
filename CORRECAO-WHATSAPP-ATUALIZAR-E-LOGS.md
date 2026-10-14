# Correção do WhatsApp — RADAR 2.0

Esta versão corrige a validação dos IDs numéricos do Phone Number ID e do WABA ID, que podia rejeitar os valores antes da tentativa de atualização.

Também adiciona logs operacionais seguros para as rotas de configuração/teste e webhook, incluindo método, rota e status HTTP, sem registrar tokens nem o conteúdo das mensagens. Os logs do webhook registram apenas metadados/resumos do evento.

O status de conexão agora depende de uma conexão validada e gravada (`whatsapp_connected_at`), em vez de considerar qualquer Phone Number ID preenchido como conexão confirmada.

## Depois de publicar

1. Substitua os arquivos pelo conteúdo deste ZIP e envie para o GitHub.
2. Aguarde o deploy no Render ficar concluído.
3. Abra **WhatsApp Business**, confira os IDs e clique em **Atualizar integração**.
4. No Render, abra **Logs** e procure por `[RADAR][HTTP] PUT /api/whatsapp-connection`.
5. Depois envie uma nova mensagem ao número conectado e procure por `[RADAR] Webhook WhatsApp recebido` e `mensagem(ns) WhatsApp processada(s)`.

O build do frontend não foi confirmado neste ambiente porque a instalação das dependências excedeu o tempo limite. O arquivo `server.js` passou na verificação de sintaxe (`node --check`).
