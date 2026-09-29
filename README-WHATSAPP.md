# WhatsApp no RADAR

## Estado atual

A tela **Vinculações** já possui a configuração de preferência de sincronização:
- **Carregar mensagens anteriores**
- **Somente mensagens novas**

A preferência fica salva no PostgreSQL e pode ser alterada depois.

O link público `wa.me` também continua disponível em **Minha empresa**.

## Próxima etapa

A integração oficial será feita pela **WhatsApp Business Platform / Meta Cloud API**. Para isso precisaremos de:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_VERIFY_TOKEN`
- uma URL pública HTTPS para o webhook

Esses segredos ficam somente no backend (Render), nunca em `VITE_*` nem no GitHub.

### Atenção sobre histórico

A opção da interface registra a intenção do usuário. A disponibilidade de mensagens históricas depende do recurso oficial de histórico disponibilizado pela Meta para a modalidade de integração utilizada; não se deve presumir que a Cloud API comum forneça todo o histórico arbitrariamente.

## Não enviar segredo pelo chat

Nunca cole um Access Token da Meta, senha do banco ou credencial do Mercado Pago na conversa ou no GitHub.
