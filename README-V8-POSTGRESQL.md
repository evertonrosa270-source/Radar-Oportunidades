# RADAR V8 — PostgreSQL

## O que mudou
O db.json não é mais usado pelo servidor. Agora usuários, empresas, produtos e mensagens ficam no PostgreSQL.
As tabelas e índices são criados automaticamente na primeira inicialização.

## 1. Instale dependências
npm install

## 2. Crie .env
Copie .env.example para .env e preencha a senha do usuário radar_app localmente.
Exemplo:
DATABASE_URL=postgresql://radar_app:SUA_SENHA@localhost:5432/radar_oportunidades

## 3. Gere um JWT_SECRET
Use uma sequência aleatória longa, com 32 ou mais caracteres.

## 4. Inicie
npm run dev

## Teste
Abra http://localhost:3000/health . Deve retornar database: connected.

## Segurança
Nunca envie o arquivo .env nem publique sua senha. O db.json antigo pode ser guardado como backup e não é usado pela V8.
