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


## Webhook implementado

Callback URL:
`https://radar-oportunidades-xrn8.onrender.com/api/webhook/whatsapp`

O backend responde ao desafio `hub.challenge` quando `hub.verify_token` coincide com `WHATSAPP_VERIFY_TOKEN`.

No Render, configure `WHATSAPP_VERIFY_TOKEN` com o mesmo valor usado no Meta.


## Ativação dentro do RADAR

Depois de configurar a Cloud API e validar o webhook na Meta:

1. No Render, mantenha `WHATSAPP_ACCESS_TOKEN` configurado no backend.
2. Entre no RADAR e abra **WhatsApp Business**.
3. Informe o **Phone Number ID** e o **WhatsApp Business Account ID**.
4. Clique em **Ativar WhatsApp Business**.
5. Mensagens de texto recebidas pelo número vinculado passam pelo webhook e são gravadas no PostgreSQL para análise.

O token da Cloud API não é exposto no frontend.


## Diagnóstico automático

Ao salvar o Phone Number ID + WABA ID, o RADAR agora consulta a Meta Graph API para validar o número e tenta inscrever o aplicativo no WABA (`subscribed_apps`). A tela também possui "Testar conexão com a Meta".

Se o número informado for o telefone (ex.: 51993773172) em vez do **Phone Number ID** fornecido pela Meta, a conexão será rejeitada com uma mensagem clara.

O webhook precisa estar configurado na Meta para o callback:
`/api/webhook/whatsapp`
e o campo de mensagens precisa estar inscrito para que novas mensagens sejam entregues ao RADAR.
