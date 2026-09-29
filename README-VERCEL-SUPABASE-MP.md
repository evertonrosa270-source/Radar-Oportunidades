# RADAR — Vercel + Supabase + Mercado Pago

## Arquitetura
- Frontend: Vercel/Vite/React.
- API: Vercel Function em `api/index.js`.
- Banco: Supabase PostgreSQL via `DATABASE_URL`.
- Cobrança: Mercado Pago Subscriptions.
- Trial: 1 dia por usuário.
- Planos: Radar Start R$ 29,90; Radar Pro R$ 49,90; Radar Business R$ 99,90.

## Variáveis da Vercel
Configure em Project Settings > Environment Variables:
- DATABASE_URL
- PGSSL=true
- JWT_SECRET
- APP_URL=https://SEU-DOMINIO-VERCEL
- ALLOWED_ORIGINS=https://SEU-DOMINIO-VERCEL
- MERCADOPAGO_ACCESS_TOKEN (produção)
- opcionalmente MP_PLAN_RADAR_START, MP_PLAN_RADAR_PRO, MP_PLAN_RADAR_BUSINESS

Para o frontend local, use `VITE_API_URL=http://localhost:3000/api`. Em produção, deixe `VITE_API_URL` vazio para usar `/api` no mesmo domínio.

## Mercado Pago
Os planos do Mercado Pago precisam de uma `back_url` pública HTTPS. O backend usa `APP_URL` da Vercel. Os planos são associados ao checkout via `preapproval_plan_id` e configurados com teste grátis de 1 dia.

## Fluxo de acesso
1. Cadastro: cria trial de 24h.
2. Enquanto o trial estiver ativo: acesso ao RADAR.
3. Trial expirado sem assinatura ativa: o usuário é levado diretamente à tela dos 3 planos e as demais áreas ficam bloqueadas.
4. Assinatura ativa: acesso liberado.
5. Webhook do Mercado Pago atualiza o status da assinatura.
