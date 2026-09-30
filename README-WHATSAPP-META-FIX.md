# Correção Meta Graph API (#100)

A integração não consulta mais o campo `whatsapp_business_account` em objetos
onde a Graph API não o disponibiliza.

O WABA deve ser informado explicitamente por:
`WHATSAPP_BUSINESS_ACCOUNT_ID`

O Phone Number ID deve ser informado por:
`WHATSAPP_PHONE_NUMBER_ID`

Não é necessário trocar tokens por causa deste erro.

Após o deploy, use o diagnóstico do WhatsApp Business no RADAR para validar:
1. Phone Number ID
2. WABA ID
3. webhook
4. último evento recebido
