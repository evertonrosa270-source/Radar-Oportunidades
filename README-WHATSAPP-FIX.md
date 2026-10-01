# RADAR OPORTUNIDADES — correção WhatsApp Business

## Problema encontrado na V1.5 Beta

A validação anterior tratava o `Phone Number ID` como se fosse o `WABA ID`. Na Graph API da Meta são identificadores diferentes.

Também havia um armazenamento legado chamado `_id`, pouco claro, e a tela podia carregar os dois IDs invertidos do PostgreSQL mesmo quando as variáveis do Render estavam corretas.

## Correções aplicadas

- Validação real do `Phone Number ID` na Graph API.
- Validação real do `WABA ID` na Graph API.
- Confirmação de que o telefone está listado dentro do WABA informado.
- Inscrição do aplicativo em `/<WABA_ID>/subscribed_apps`.
- Nova coluna canônica `whatsapp_business_account_id`.
- Migração automática dos dados antigos de `_id` para a coluna canônica.
- Webhook vincula mensagens primeiro pelo `phone_number_id` e depois pelo WABA.
- Se os dois IDs forem informados invertidos, o servidor detecta e corrige automaticamente.
- O botão **Testar conexão com a Meta** também salva os IDs corrigidos no PostgreSQL.
- O botão **Ativar integração** salva sempre os IDs retornados pela Meta, não os valores brutos digitados.
- O backend usa as variáveis do Render como fallback quando os campos da conta ainda estão vazios.
- Corrigidas regex numéricas que estavam excessivamente escapadas no arquivo desta versão.

## Variáveis

### Render / backend

Configure no Render:

- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_VERSION=v23.0`
- `WHATSAPP_WEBHOOK_URL=https://radar-oportunidades-xrn8.onrender.com/api/webhook/whatsapp`

O token do WhatsApp **não deve ser colocado na Vercel**.

### Vercel / frontend

A Vercel precisa apenas apontar o frontend para o backend, por exemplo:

`VITE_API_URL=https://radar-oportunidades-xrn8.onrender.com/api`

Não coloque `WHATSAPP_ACCESS_TOKEN` na Vercel.

## IDs da configuração atual do RADAR

- Phone Number ID: `1243057418900394`
- WhatsApp Business Account ID: `1003246327242183`

## Histórico anterior

A opção de carregar histórico continua sendo armazenada como preferência da empresa, mas ela não inventa uma API de histórico que a Cloud API não oferece genericamente. As mensagens novas dependem do webhook e da inscrição do aplicativo no WABA.

## Verificação feita neste pacote

- `node --check server.js` passou.
- Rotas de conexão, diagnóstico, webhook e persistência foram revisadas em conjunto.
- O pacote mantém o restante da V1.5 Beta.

O build do frontend deve ser executado pelo pipeline normal do Render/Vercel (`npm run build`).
