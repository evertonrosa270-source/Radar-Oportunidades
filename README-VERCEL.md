# RADAR OPORTUNIDADES — Vercel + Supabase + Mercado Pago

## Deploy
1. Envie esta pasta para um repositório GitHub.
2. Importe o repositório no Vercel.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Configure as variáveis do `.env.example` no Vercel.
6. `APP_URL` deve ser a URL HTTPS final do projeto Vercel.
7. `ALLOWED_ORIGINS` deve ser a mesma URL HTTPS final.
8. Use o Transaction Pooler do Supabase (porta 6543) em `DATABASE_URL`.
9. Configure no Mercado Pago o webhook para `https://SEU-PROJETO.vercel.app/api/webhooks/mercadopago`.

## Fluxo
- Cadastro: 1 dia de teste local no RADAR.
- Depois do teste: o app bloqueia as áreas e mostra os 3 planos.
- Checkout: o usuário é enviado ao link oficial do plano do Mercado Pago.
- Os planos do Mercado Pago são criados com teste grátis de 1 dia.
- Ao retornar ao RADAR, o sistema sincroniza a assinatura pelo e-mail + plano.
- O webhook mantém o status local atualizado.

## Segurança
- Não envie `.env` para GitHub/Vercel como arquivo.
- Não envie `node_modules`.
- Coloque segredos somente nas Environment Variables do Vercel.


## Dois modos de assinatura

### 1. Modo teste local
Use no `.env` local:
`RADAR_LOCAL_TEST=true`
`VITE_LOCAL_TEST=true`

Nesse modo o botão dos planos ativa uma assinatura simulada, sem cobrança e sem criar checkout no Mercado Pago. Serve para testar cadastro, bloqueio após trial, ativação, troca de plano e cancelamento.

### 2. Modo profissional
Use:
`RADAR_LOCAL_TEST=false`
`VITE_LOCAL_TEST=false`

O botão usa o fluxo real do Mercado Pago. Durante o desenvolvimento, você pode manter o **Access Token de teste**. Em produção, troque para as credenciais de produção e mantenha `APP_URL` como a URL HTTPS da Vercel.

O modo teste é bloqueado automaticamente quando `NODE_ENV=production`.

## Diferenciação dos planos

Os planos agora possuem limites reais aplicados no backend:

- **Radar Start — R$ 29,90/mês:** 500 mensagens analisadas/mês, até 20 produtos/serviços, histórico de 7 dias, importação de até 100 mensagens por vez.
- **Radar Pro — R$ 49,90/mês:** 5.000 mensagens/mês, até 200 produtos/serviços, histórico de 90 dias, importação de até 500 por vez e sugestões de resposta com IA.
- **Radar Business — R$ 99,90/mês:** 20.000 mensagens/mês, até 1.000 produtos/serviços, histórico de 365 dias, importação de até 1.000 por vez e sugestões de resposta com IA.

O **Free Trial de 1 dia** utiliza os limites do Radar Pro para que o usuário consiga experimentar os recursos avançados. Ao terminar o trial, o acesso é bloqueado até a escolha de um plano.

A tela de Assinatura permanece disponível para troca de plano. No modo teste a troca é imediata e sem cobrança; no modo profissional o checkout é feito pelo Mercado Pago.
