# RADAR — GitHub → Supabase → Render → Vercel

Este pacote foi preparado para a arquitetura:

- GitHub: código-fonte
- Supabase: PostgreSQL
- Render: backend Node/Express
- Vercel: frontend React/Vite
- Mercado Pago: cobrança, depois
- Meta WhatsApp Business: integração, depois

## 1. GitHub
Crie o repositório como:
- Public (ou Private, se preferir)
- README: Off
- .gitignore: Node
- License: No license

Envie o conteúdo desta pasta para o repositório. **Não envie .env** e nunca coloque tokens ou senhas no código.

## 2. Supabase
Crie um projeto PostgreSQL. Depois copie a conexão do **Transaction Pooler** (porta 6543) para `DATABASE_URL`.

O próprio `server.js` cria/migra as tabelas necessárias quando o backend inicia.

## 3. Render
Crie um Web Service a partir do mesmo repositório GitHub.

- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check: `/health`

Variáveis obrigatórias:
- `NODE_ENV=production`
- `DATABASE_URL=...`
- `PGSSL=true`
- `JWT_SECRET=...`
- `APP_URL=https://SEU-PROJETO.vercel.app`
- `ALLOWED_ORIGINS=https://SEU-PROJETO.vercel.app`
- `ADMIN_EMAIL=...`

Mercado Pago só precisa ser preenchido quando formos ativar cobrança real.

Após o deploy, teste:
`https://SEU-BACKEND.onrender.com/health`

O esperado é uma resposta JSON indicando `ok: true` e banco conectado.

## 4. Vercel
Importe o mesmo repositório GitHub como projeto Vercel.

- Build Command: `npm run build`
- Output Directory: `dist`

Crie a variável de ambiente:
`VITE_API_URL=https://SEU-BACKEND.onrender.com/api`

Não coloque token do Mercado Pago, senha do banco ou token do WhatsApp em `VITE_*`: variáveis `VITE_*` chegam ao navegador.

## 5. Depois do primeiro deploy
1. Testar cadastro/login.
2. Testar criação de produto.
3. Testar análise de mensagem.
4. Testar Assinatura.
5. Testar acesso administrativo.
6. Configurar domínio.
7. Atualizar `APP_URL` e `ALLOWED_ORIGINS` para o domínio final.
8. Só então continuar a configuração do WhatsApp Business/Meta.

## 6. WhatsApp
A interface de **Vinculações** e a preferência de histórico já estão no projeto. A integração oficial da Meta exige endpoints de webhook públicos em HTTPS e credenciais mantidas somente no backend.

**Importante:** este backup atual ainda não contém os endpoints oficiais de webhook da Meta. Não considere o WhatsApp pronto apenas porque a tela existe. Primeiro colocaremos o RADAR online; depois implementaremos/testaremos o webhook oficial.
