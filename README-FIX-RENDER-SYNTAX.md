# Correção do deploy no Render

Corrigido o erro de sintaxe que fazia o Render parar em `server.js`:

`const metaWaba=String(owned?.?.id||"");`

foi corrigido para:

`const metaWaba=String(owned?.id||"");`

O `server.js` foi validado com `node --check` antes da criação deste ZIP.
