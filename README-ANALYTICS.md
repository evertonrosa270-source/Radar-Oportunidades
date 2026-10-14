# Estatísticas de visitantes — RADAR Oportunidades

## O que foi incluído

- Coleta de visualizações somente depois que o visitante aceita estatísticas.
- Opção persistente para aceitar ou recusar e botão **Privacidade** para reabrir as preferências.
- Identificadores pseudônimos de visitante e sessão; sem gravar IP, user-agent, senhas, tokens, conteúdo de mensagens ou URL completa.
- Registro separado para site público e páginas internas autenticadas.
- Tabelas `analytics_events` e índices criados automaticamente durante a inicialização do backend.
- Painel administrativo com visitantes online estimados (atividade nos últimos 5 minutos), visitantes únicos, visualizações, sessões, série diária, páginas populares, origem, novos/recorrentes e separação entre público e autenticado.
- Exclusão automática dos eventos com mais de 180 dias na inicialização do backend.
- Endpoints administrativos protegidos por JWT e comparação do e-mail da conta autenticada com `ADMIN_EMAIL` configurado no servidor.

## Deploy

1. No Render, confirme que `ADMIN_EMAIL` está definido com o e-mail exato da conta que deve administrar o RADAR. O backend já utiliza essa variável para identificar o administrador.
2. Confirme no Render que `DATABASE_URL` aponta para o PostgreSQL correto do Supabase e que `JWT_SECRET` continua definido com pelo menos 32 caracteres.
3. Na Vercel, confirme `VITE_API_URL=https://radar-oportunidades-xrn8.onrender.com/api` (ou a URL real do seu backend terminada em `/api`). A variável é incorporada no build do frontend; depois de alterá-la, faça novo deploy.
4. Envie o projeto ao GitHub e faça deploy. A inicialização do backend cria a tabela de métricas e os índices; não é necessário executar SQL manualmente.
5. Entre com a conta cujo e-mail corresponde a `ADMIN_EMAIL`, aceite estatísticas no site e navegue por algumas páginas. Abra **Estatísticas de visitantes** no menu. Os números começarão a aparecer a partir do momento em que houver visitas consentidas; não existe histórico retroativo.
6. Verifique o endpoint de saúde existente `/health` e os logs do Render após o deploy. Faça também um teste com uma conta comum para confirmar que ela recebe `403` ao tentar abrir `/api/admin/analytics`.

## Privacidade e limitações

- O consentimento é opt-in: se a pessoa recusar, não é enviado evento de analytics.
- Os visitantes são estimativas por identificadores locais; limpar o armazenamento do navegador ou usar outro dispositivo/navegador pode contar a mesma pessoa como visitante novo.
- “Online agora” significa uma sessão que enviou evento nos últimos cinco minutos, não prova que a pessoa ainda esteja olhando para a página.
- A origem é o domínio referenciador disponível no navegador; alguns navegadores e políticas de privacidade podem omiti-lo.
- O painel só terá dados futuros após o deploy e após consentimento.
- A política de privacidade foi atualizada com a descrição da coleta. Antes de lançamento comercial, o responsável pelo serviço deve revisar a política, identificar o controlador e incluir um canal de contato válido para solicitações LGPD.
