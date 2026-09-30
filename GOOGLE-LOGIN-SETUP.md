# Login com Google — RADAR

O projeto já contém o fluxo de login/cadastro com Google. Falta apenas cadastrar o aplicativo no Google Cloud e colocar o mesmo Client ID no frontend e no backend.

## 1. Criar o Client ID

No Google Cloud Console, crie um OAuth Client ID do tipo **Web application**.

Em **Authorized JavaScript origins**, adicione:

- `http://localhost:5173`
- `https://radar-oportunidades-xrn8.onrender.com`
- `https://radar-oportunidades-eit4-three.vercel.app`

Se o RADAR ganhar um domínio próprio, adicione também o domínio HTTPS dele.

Este projeto usa o botão Google em modo popup, então não é necessário inventar uma URL de callback para o backend. O navegador recebe o ID Token e o envia ao endpoint `/api/auth/google`; o servidor valida assinatura, emissor, audiência e expiração antes de criar a sessão.

## 2. Render

Adicione a variável de ambiente:

`GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com`

O `render.yaml` já declara essa variável como secreta.

## 3. Vercel

Adicione a variável de ambiente do frontend:

`VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com`

Depois faça um novo deploy.

## 4. Local

No `.env` do backend:

`GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com`

No `.env.local`/ambiente do Vite:

`VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com`

## 5. Segurança

Não coloque Client Secret no frontend. O RADAR usa somente o Client ID no navegador. O backend valida o ID Token recebido do Google. O identificador persistente da conta Google é o `sub`, não o e-mail.

## 6. Contas existentes

- Conta nova Google: cria conta RADAR e inicia o trial.
- Conta RADAR existente com Gmail: o login Google pode ser vinculado à conta existente.
- Conta existente com outro domínio de e-mail: o RADAR exige o login por senha antes de permitir vinculação automática.
- Conta criada somente com Google: tentar entrar pela senha informa para usar o botão Google.

## 7. Correção de deploy do botão

O frontend também consegue obter o `GOOGLE_CLIENT_ID` público do backend em `/api/config`.
Isso evita que o botão desapareça apenas porque `VITE_GOOGLE_CLIENT_ID` não foi injetado no build do Vercel.

A variável `GOOGLE_CLIENT_ID` continua obrigatória no Render, porque o backend usa o mesmo Client ID para validar o ID Token recebido do Google.

