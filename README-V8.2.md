# RADAR V8.3 — Correção da conexão PostgreSQL

## O que foi corrigido
- O backend carrega o `.env` diretamente com dotenv.
- Não depende mais do `node --env-file`.
- Senhas com caracteres especiais são suportadas quando colocadas entre aspas duplas.
- O terminal mostra um diagnóstico seguro da conexão sem revelar a senha.
- A pasta temporária `.vs` foi removida do pacote.
- O Vite continua ignorando `.vs`.

## Configure o arquivo `.env`
Use:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=radar_oportunidades
DB_USER=radar_app
DB_PASSWORD="SUA_SENHA"

DATABASE_URL=

Importante: mantenha as aspas duplas da linha DB_PASSWORD.

## Teste
npm install
npm run dev

O terminal deve mostrar:
[RADAR] PostgreSQL: ... senha_carregada=sim tamanho=...

Depois:
RADAR V8 API em execução na porta 3000 com PostgreSQL
