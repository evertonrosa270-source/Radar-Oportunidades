# RADAR V1.5 — correções de trial, limites e assinatura

## Alterações
- Free Trial passa de 1 para 3 dias.
- Novas contas deixam de herdar os 5.000 limites do Radar Pro durante o trial.
- Free Trial passa a ter 200 mensagens/mês, 20 produtos/serviços, 7 dias de histórico e IA básica.
- Usuários que ainda estavam em um trial ativo de 1 dia recebem uma extensão única de 2 dias; a migração é protegida por `trial_policy_version`.
- A aba Assinatura foi redesenhada com hierarquia visual, indicadores de consumo, status da assinatura, ícones e cartões de planos.
- O retorno do Mercado Pago agora tenta sincronizar a assinatura e informa na tela se o plano foi confirmado/ativado.
- Assinaturas pendentes são sincronizadas automaticamente ao abrir a aba Assinatura.
- O usuário pode usar “Atualizar status” para confirmar uma assinatura pendente.
- O status ativo continua sendo determinado no servidor pelos estados `authorized`/`active` do Mercado Pago.

## Verificação
- `node --check server.js`: OK.
- O build completo do frontend não pôde ser concluído neste ambiente porque a instalação das dependências do npm excedeu o tempo disponível; nenhum `node_modules` foi incluído no ZIP final.
