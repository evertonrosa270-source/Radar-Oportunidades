# Mercado Pago — preparação do Radar

A integração foi preparada sem gravar nenhuma credencial do Mercado Pago.

## O que já está pronto
- Tabelas PostgreSQL: `plans`, `subscriptions` e `payments`.
- Planos locais: Starter, Pro e Business (valores são provisórios e podem ser alterados).
- Endpoint para listar planos e consultar assinatura.
- Endpoint para iniciar assinatura recorrente pelo Mercado Pago.
- Endpoint de webhook para receber eventos do Mercado Pago.
- Tela `Assinatura` no Radar.
- Variáveis de ambiente preparadas.

## Quando a conta do Mercado Pago estiver acessível
No `.env` existente, acrescentar:

```env
MP_ACCESS_TOKEN=""
APP_URL="http://localhost:5173"
```

O `MP_ACCESS_TOKEN` será colocado somente localmente. Não envie esse token pelo chat.

## Próximo passo
1. Criar a aplicação no Mercado Pago.
2. Obter o Access Token de teste.
3. Criar/vincular os planos recorrentes no Mercado Pago.
4. Colocar os IDs dos planos em `plans.mercadopago_plan_id`.
5. Configurar o webhook público quando o Radar estiver hospedado.
6. Fazer um pagamento de teste.

A cobrança recorrente usa a API de Assinaturas do Mercado Pago (`/preapproval` e `/preapproval_plan`).
