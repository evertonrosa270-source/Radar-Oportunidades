# Correção Meta Graph API — fields

Corrigida a expressão de campos enviada à Meta.

Antes havia uma lista terminada com vírgula:
`id,display_phone_number,verified_name,`

Agora a lista termina corretamente em:
`id,display_phone_number,verified_name`

O `server.js` também foi validado com `node --check`.
