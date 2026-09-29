# Checklist de lançamento

## Código
- [x] Helmet
- [x] CORS por lista permitida
- [x] Rate limit global e de autenticação
- [x] JWT único, HS256, expiração de 8h
- [x] JWT_SECRET obrigatório em produção
- [x] Senha com bcrypt (cost 12)
- [x] Validação de e-mail, URLs e tamanho de dados
- [x] Limites de importação e mensagens
- [x] IDs UUID
- [x] Sem segredo no código de produção

## Ainda obrigatório na infraestrutura
- [ ] HTTPS ativo
- [ ] WAF/CDN configurado
- [ ] Banco de dados gerenciado (PostgreSQL recomendado)
- [ ] Backup automático
- [ ] Monitoramento e alertas
- [ ] Variáveis .env configuradas no provedor
- [ ] Domínio configurado
- [ ] Teste de recuperação de backup
- [ ] Revisão de privacidade/LGPD

## Antes de vender
Não use db.json como banco definitivo para múltiplos usuários. A próxima etapa técnica recomendada é migrar para PostgreSQL.
