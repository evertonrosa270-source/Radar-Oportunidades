# RADAR V6 — Segurança

Incluído:
- Helmet (headers de segurança)
- CORS restrito por ALLOWED_ORIGINS
- Limite global de requisições
- Limite rígido para login e cadastro
- Limite de tamanho para JSON
- Validação de URLs da empresa
- JWT_SECRET obrigatório em produção
- Ocultação do X-Powered-By
- Arquivo .env.example
- Tratamento centralizado de erros

## Antes de lançar
1. Execute `npm install`
2. Copie `.env.example` para `.env`
3. Gere um JWT_SECRET longo e aleatório
4. Configure ALLOWED_ORIGINS com o domínio real
5. Use HTTPS no provedor
6. Coloque o app atrás de WAF/CDN do provedor

Importante: esta versão endurece o aplicativo, mas segurança de produção também depende da hospedagem, HTTPS, backups, banco de dados, monitoramento e auditoria contínua.
