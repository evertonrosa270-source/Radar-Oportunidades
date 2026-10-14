# Correção — Painel administrativo de clientes

## O que foi incluído
- Nova opção **Clientes (admin)** na navegação do RADAR, ao lado de Estatísticas de visitantes.
- Pesquisa por nome, e-mail ou nome da empresa.
- Lista de cadastro, empresa/segmento, fim do período de teste e situação/plano da assinatura.
- Endpoint `GET /api/admin/customers`, protegido por JWT e validação de `ADMIN_EMAIL no backend`.
- O endpoint não retorna senha, hash de senha, tokens, conteúdo de mensagens ou dados de pagamento.

## Configuração obrigatória
No Render, configure `ADMIN_EMAIL` com o e-mail exato da conta RADAR que deve ser administradora (o mesmo e-mail usado no login, sem espaços extras). Depois faça deploy/redeploy do backend.

Na Vercel, configure `VITE_API_URL` com a URL do backend terminada em `/api`, por exemplo:
`https://radar-oportunidades-xrn8.onrender.com/api`

Depois faça um novo deploy da Vercel para compilar o frontend com a variável correta.

Entre novamente no RADAR com a conta cujo e-mail corresponde a `ADMIN_EMAIL`. A navegação administrativa só aparece para essa conta. Mesmo que alguém tente chamar o endpoint manualmente, o backend verifica a autorização.

## Validação
- `node --check server.js`: aprovado.
- O build do frontend não foi confirmado neste ambiente porque a instalação das dependências não terminou; confirme o build no deploy da Vercel.
- A conexão ao Supabase e a autorização em produção precisam ser verificadas após o deploy.

## Observações
Esta alteração adiciona uma página de administração de clientes. Ela não altera os fluxos de login, Mercado Pago ou WhatsApp. Não inclui ações de editar/excluir contas para evitar alterações administrativas destrutivas.
