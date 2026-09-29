# Radar V8 — Mercado Pago V3

## Correção aplicada
- A tabela `plans` agora possui UUID gerado automaticamente com `gen_random_uuid()`.
- A inicialização também corrige instalações existentes em que `plans.id` não tinha DEFAULT.
- Foram adicionadas as tabelas `subscriptions` e `payments` para preparar a integração.
- Um plano inicial `Radar Pro` é criado de forma idempotente.
- O token do Mercado Pago continua somente no `.env`.

## Configuração local
No `.env`:
```env
MERCADOPAGO_ACCESS_TOKEN="SEU_TOKEN_DE_TESTE"
APP_URL="http://localhost:5173"
```
Não compartilhe o token.

## Execução
```bash
npm install
npm run dev
```
