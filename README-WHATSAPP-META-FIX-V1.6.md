# Correção WhatsApp Meta — V1.6

## Erro corrigido

A V1.5 comparava incorretamente o `id` retornado ao consultar o
Phone Number ID com o WABA ID.

Na Graph API, são identificadores diferentes:

- `Phone Number ID`: identifica o número do WhatsApp Business.
- `WhatsApp Business Account ID (WABA ID)`: identifica a conta empresarial.

A V1.6 agora:

1. valida o Phone Number ID;
2. consulta `/{WABA_ID}/phone_numbers` e confirma que o Phone Number ID
   está dentro daquele WABA;
3. só depois chama `/{WABA_ID}/subscribed_apps` para inscrever o aplicativo;
4. mantém o token somente no servidor.

## Se ainda der erro após o deploy

Se a consulta ao WABA continuar retornando `Unsupported get request`,
`missing permissions` ou erro semelhante, o problema passa a ser externo
ao código: o token configurado no Render não tem acesso ao WABA informado,
ou o WABA/Phone Number ID não pertence ao mesmo ambiente/app.

No RADAR, os dois campos devem conter IDs da Meta, não o número de telefone
visível do WhatsApp.

## Teste

Após publicar a V1.6:

1. abra **WhatsApp Business**;
2. confira Phone Number ID;
3. confira WABA ID;
4. clique **Atualizar integração**;
5. se conectar, clique **Testar conexão com a Meta**;
6. depois envie uma nova mensagem para o WhatsApp Business para testar o webhook.
