# RADAR V8.1 — Correções de inicialização

## Corrigido
1. Vite ignora a pasta `.vs` criada pelo Visual Studio, evitando o erro EBUSY.
2. PostgreSQL agora pode ser configurado sem `DATABASE_URL`.
3. Senhas com `@`, `#`, `:`, `/`, `?` e outros caracteres especiais funcionam usando `DB_PASSWORD`.

## Como configurar
Copie `.env.example` para `.env` e preencha apenas:

DB_PASSWORD=sua senha do usuário radar_app

Os demais valores já correspondem ao banco criado:
- host: localhost
- porta: 5432
- banco: radar_oportunidades
- usuário: radar_app

Depois execute:

npm install
npm run dev

Se o banco estiver funcionando, aparecerá:
RADAR V8 API em execução na porta 3000 com PostgreSQL
