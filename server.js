import dotenv from "dotenv";
dotenv.config({ path: ".env", override: true });
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pg from "pg";

const { Pool } = pg;
const PORT=Number(process.env.PORT||3000);
const NODE_ENV=process.env.NODE_ENV||"development";
const JWT_SECRET=process.env.JWT_SECRET;
const DATABASE_URL=(process.env.DATABASE_URL||"").trim();
const DB_HOST=(process.env.DB_HOST||"localhost").trim();
const DB_PORT=Number(process.env.DB_PORT||5432);
const DB_NAME=(process.env.DB_NAME||"radar_oportunidades").trim();
const DB_USER=(process.env.DB_USER||"radar_app").trim();
const DB_PASSWORD=process.env.DB_PASSWORD||"";
const MP_ACCESS_TOKEN=(process.env.MERCADOPAGO_ACCESS_TOKEN||"").trim();
const LOCAL_TEST_FLAG=String(process.env.RADAR_LOCAL_TEST||"").toLowerCase()==="true";
const IS_VERCEL=String(process.env.VERCEL||"")==="1";
const LOCAL_TEST_MODE=LOCAL_TEST_FLAG && NODE_ENV!=="production" && !IS_VERCEL;
const APP_URL=(process.env.APP_URL||`http://localhost:${5173}`).trim();
const ADMIN_EMAIL=(process.env.ADMIN_EMAIL||"").trim().toLowerCase();
const MP_API="https://api.mercadopago.com";

if(NODE_ENV==="production" && (!JWT_SECRET || JWT_SECRET.length<32)) throw new Error("JWT_SECRET forte (mínimo 32 caracteres) é obrigatório em produção.");
const SECRET=JWT_SECRET||"dev-only-secret-change-before-production-123456";
const allowedOrigins=(process.env.ALLOWED_ORIGINS||"http://localhost:5173,http://127.0.0.1:5173").split(",").map(x=>x.trim()).filter(Boolean);

// V8.1 aceita dois formatos:
// 1) DATABASE_URL completa
// 2) DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD
// O segundo formato evita erro de URL quando a senha contém @, #, :, / ou outros caracteres especiais.
const poolConfig=DATABASE_URL
  ? {connectionString:DATABASE_URL}
  : {host:DB_HOST,port:DB_PORT,database:DB_NAME,user:DB_USER,password:DB_PASSWORD};

// Diagnóstico seguro: nunca mostra a senha, apenas confirma se ela foi carregada.
console.log(`[RADAR] PostgreSQL: host=${DB_HOST} porta=${DB_PORT} banco=${DB_NAME} usuario=${DB_USER} senha_carregada=${DB_PASSWORD.length > 0 ? "sim" : "não"} tamanho=${DB_PASSWORD.length}`);

const pool=new Pool({
  ...poolConfig,
  ssl:process.env.PGSSL==="true"?{rejectUnauthorized:false}:false,
  max:10,
  idleTimeoutMillis:30000,
  connectionTimeoutMillis:10000
});

const app=express(); app.disable("x-powered-by"); if(NODE_ENV==="production") app.set("trust proxy",1);
app.use(helmet({contentSecurityPolicy:false,crossOriginResourcePolicy:{policy:"cross-origin"}}));
app.use(cors({origin(origin,cb){if(!origin||allowedOrigins.includes(origin))return cb(null,true);return cb(Object.assign(new Error("Origem não permitida."),{status:403}));},methods:["GET","POST","PUT","DELETE"],allowedHeaders:["Content-Type","Authorization"]}));
app.use(express.json({limit:"200kb"}));
const apiLimiter=rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false,message:{error:"Muitas requisições. Tente novamente mais tarde."}});
const authLimiter=rateLimit({windowMs:15*60*1000,max:8,standardHeaders:true,legacyHeaders:false,skipSuccessfulRequests:true,message:{error:"Muitas tentativas. Aguarde alguns minutos."}});
app.use("/api",apiLimiter); app.use("/api/login",authLimiter); app.use("/api/register",authLimiter);

async function initDb(){
 // Ordem: tabelas-pai primeiro, para que as chaves estrangeiras funcionem
 // tanto em uma instalação nova quanto em uma base já existente.
 await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

 await pool.query(`CREATE TABLE IF NOT EXISTS users (
   id UUID PRIMARY KEY,
   name VARCHAR(120) NOT NULL,
   email VARCHAR(254) NOT NULL UNIQUE,
   password_hash TEXT NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;`);
 await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;`);

 await pool.query(`CREATE TABLE IF NOT EXISTS companies (
   user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
   name VARCHAR(120) NOT NULL DEFAULT '',
   segment VARCHAR(80) NOT NULL DEFAULT '',
   website VARCHAR(300) NOT NULL DEFAULT '',
   whatsapp_link VARCHAR(300) NOT NULL DEFAULT '',
   whatsapp_load_history BOOLEAN NOT NULL DEFAULT TRUE,
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 await pool.query(`ALTER TABLE companies ADD COLUMN IF NOT EXISTS whatsapp_load_history BOOLEAN NOT NULL DEFAULT TRUE;`);

 await pool.query(`CREATE TABLE IF NOT EXISTS products (
   id UUID PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   name VARCHAR(120) NOT NULL,
   description VARCHAR(500) NOT NULL DEFAULT '',
   price NUMERIC(14,2) NOT NULL CHECK(price>0 AND price<=1000000000),
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 await pool.query(`CREATE TABLE IF NOT EXISTS messages (
   id UUID PRIMARY KEY,
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   customer VARCHAR(120) NOT NULL,
   message TEXT NOT NULL,
   product VARCHAR(120) NOT NULL DEFAULT 'Não identificado',
   value NUMERIC(14,2) NOT NULL DEFAULT 0,
   status VARCHAR(40) NOT NULL,
   reason TEXT NOT NULL DEFAULT '',
   confidence INTEGER,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 await pool.query(`CREATE TABLE IF NOT EXISTS plans (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   name VARCHAR(80) NOT NULL,
   price NUMERIC(14,2) NOT NULL CHECK(price>=0),
   interval VARCHAR(20) NOT NULL DEFAULT 'month',
   active BOOLEAN NOT NULL DEFAULT TRUE,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 // Migração segura para bases criadas por versões anteriores.
 await pool.query(`ALTER TABLE plans ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
 await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS code VARCHAR(80);`);
 await pool.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS mercadopago_plan_id VARCHAR(120);`);
 await pool.query(`UPDATE plans SET code = 'LEGACY_' || id::text WHERE code IS NULL;`);
 await pool.query(`ALTER TABLE plans ALTER COLUMN code SET NOT NULL;`);
 await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_code_unique ON plans(code);`);
 await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_name_unique ON plans(name);`);

 await pool.query(`CREATE TABLE IF NOT EXISTS subscriptions (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   plan_id UUID REFERENCES plans(id),
   mercadopago_preapproval_id VARCHAR(120),
   mercadopago_plan_id VARCHAR(120),
   status VARCHAR(40) NOT NULL DEFAULT 'pending',
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 // Migração segura: instalações anteriores podem já ter a tabela subscriptions
 // com estrutura antiga. CREATE TABLE IF NOT EXISTS não altera colunas existentes.
 await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);`);
 await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mercadopago_preapproval_id VARCHAR(120);`);
 await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mercadopago_plan_id VARCHAR(120);`);
 await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'pending';`);
 await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
 await pool.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

 await pool.query(`CREATE TABLE IF NOT EXISTS payments (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
   mercadopago_payment_id VARCHAR(120),
   status VARCHAR(40) NOT NULL DEFAULT 'pending',
   amount NUMERIC(14,2) NOT NULL DEFAULT 0,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
 );`);

 await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);`);
 await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages(user_id,created_at DESC);`);
 await pool.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);`);
 await pool.query(`CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);`);

 await pool.query(`
   UPDATE plans p SET code='RADAR_START',price=29.90,interval='month',active=TRUE WHERE p.name='Radar Start' AND NOT EXISTS (SELECT 1 FROM plans x WHERE x.code='RADAR_START' AND x.id<>p.id);
   UPDATE plans p SET code='RADAR_PRO',price=49.90,interval='month',active=TRUE WHERE p.name='Radar Pro' AND NOT EXISTS (SELECT 1 FROM plans x WHERE x.code='RADAR_PRO' AND x.id<>p.id);
   UPDATE plans p SET code='RADAR_BUSINESS',price=99.90,interval='month',active=TRUE WHERE p.name='Radar Business' AND NOT EXISTS (SELECT 1 FROM plans x WHERE x.code='RADAR_BUSINESS' AND x.id<>p.id);
 `);
 await pool.query(`
   INSERT INTO plans(code,name,price,interval,active)
   VALUES
    ('RADAR_START','Radar Start',29.90,'month',TRUE),
    ('RADAR_PRO','Radar Pro',49.90,'month',TRUE),
    ('RADAR_BUSINESS','Radar Business',99.90,'month',TRUE)
   ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name,price=EXCLUDED.price,interval=EXCLUDED.interval,active=TRUE;
 `);
}
function cleanText(v,max){return String(v??"").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,max)}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(v||"").trim())}
function validUrl(v){if(!v)return true;try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)}catch{return false}}
function id(){return crypto.randomUUID()}
function auth(req,res,next){const h=req.headers.authorization||"";if(!h.startsWith("Bearer "))return res.status(401).json({error:"Sessão inválida."});try{req.user=jwt.verify(h.slice(7),SECRET,{algorithms:["HS256"]});next()}catch{return res.status(401).json({error:"Sessão inválida ou expirada."})}}
const PLAN_RULES={
 RADAR_START:{label:"Radar Start",messageLimit:500,productLimit:20,historyDays:7,teamLimit:1,aiLevel:"Básica",aiReply:false,reports:"Básicos"},
 RADAR_PRO:{label:"Radar Pro",messageLimit:5000,productLimit:200,historyDays:90,teamLimit:3,aiLevel:"Avançada",aiReply:true,reports:"Completos"},
 RADAR_BUSINESS:{label:"Radar Business",messageLimit:20000,productLimit:1000,historyDays:365,teamLimit:10,aiLevel:"Avançada + prioridade",aiReply:true,reports:"Avançados"}
};
function ruleFor(code){return PLAN_RULES[String(code||"").toUpperCase()]||PLAN_RULES.RADAR_START}
async function getEntitlements(userId){
 const u=(await pool.query(`SELECT email,trial_ends_at FROM users WHERE id=$1`,[userId])).rows[0];
 const isAdmin=!!ADMIN_EMAIL && String(u?.email||"").toLowerCase()===ADMIN_EMAIL;
 const trialEnds=u?.trial_ends_at?new Date(u.trial_ends_at):null; const trialActive=!!trialEnds&&trialEnds>new Date();
 const sub=(await pool.query(`SELECT s.id,s.status,p.code,p.name,p.price::float AS price FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.user_id=$1 AND LOWER(s.status) IN ('authorized','active') ORDER BY s.created_at DESC LIMIT 1`,[userId])).rows[0];
 const paidActive=!!sub; const planCode=isAdmin?"RADAR_BUSINESS":(paidActive?sub.code:(trialActive?"RADAR_PRO":null)); const rule=ruleFor(planCode);
 const usage=(await pool.query(`SELECT COUNT(*)::int AS count FROM messages WHERE user_id=$1 AND created_at>=date_trunc('month',NOW())`,[userId])).rows[0];
 const productCount=(await pool.query(`SELECT COUNT(*)::int AS count FROM products WHERE user_id=$1`,[userId])).rows[0];
 return {isAdmin,trialActive:!isAdmin&&trialActive,trialEndsAt:u?.trial_ends_at||null,paidActive:isAdmin||paidActive,subscriptionStatus:isAdmin?"admin":(sub?.status||null),planCode,planName:isAdmin?"Administrador · Radar Business":(sub?.name||(trialActive?"Free Trial · Radar Pro":"Nenhum")),messageLimit:rule.messageLimit,productLimit:rule.productLimit,historyDays:rule.historyDays,teamLimit:rule.teamLimit,aiLevel:rule.aiLevel,aiReply:rule.aiReply,reports:rule.reports,messagesUsed:usage.count,productsUsed:productCount.count,canUse:isAdmin||trialActive||paidActive};
}
async function requireAccess(req,res,next){try{const e=await getEntitlements(req.user.id);if(!e.canUse)return res.status(402).json({error:"Seu período de teste terminou. Escolha um plano para continuar.",code:"SUBSCRIPTION_REQUIRED"});req.entitlements=e;next()}catch(e){next(e)}}
async function requireMessageCapacity(req,res,next){try{const e=req.entitlements||await getEntitlements(req.user.id);if(e.messagesUsed>=e.messageLimit)return res.status(429).json({error:`Você atingiu o limite de ${e.messageLimit.toLocaleString('pt-BR')} mensagens analisadas neste mês. Faça upgrade do plano para continuar.`,code:"MESSAGE_LIMIT",limit:e.messageLimit,used:e.messagesUsed});req.entitlements=e;next()}catch(e){next(e)}}
async function requireProductCapacity(req,res,next){try{const e=req.entitlements||await getEntitlements(req.user.id);if(e.productsUsed>=e.productLimit)return res.status(429).json({error:`Seu plano permite até ${e.productLimit.toLocaleString('pt-BR')} produtos/serviços. Faça upgrade para cadastrar mais.`,code:"PRODUCT_LIMIT",limit:e.productLimit,used:e.productsUsed});req.entitlements=e;next()}catch(e){next(e)}}

async function getPublicUser(userId){
 const q=await pool.query(`SELECT u.id,u.name,u.email,u.trial_started_at,u.trial_ends_at,c.name company_name,c.segment,c.website,c.whatsapp_link,c.whatsapp_load_history FROM users u LEFT JOIN companies c ON c.user_id=u.id WHERE u.id=$1`,[userId]);
 const u=q.rows[0]; if(!u)return null; const access=await getEntitlements(userId);
 return {id:u.id,name:u.name,email:u.email,trialStartedAt:u.trial_started_at,trialEndsAt:u.trial_ends_at,access:{...access,canUse:access.canUse},company:{name:u.company_name||"",segment:u.segment||"",website:u.website||"",whatsappLink:u.whatsapp_link||"",whatsappLoadHistory:u.whatsapp_load_history!==false}}
}

function normalize(v){return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
function classify(message,products){const t=normalize(message);const product=products.find(p=>normalize(p.name).split(/\s+/).filter(w=>w.length>3).some(w=>t.includes(w)));const noReply=/sem resposta|nao respondeu|ainda aguardo|aguardando.*resposta|nao tive retorno/.test(t),delay=/vou pensar|pensar melhor|depois|mais tarde|te aviso|nao decidi|em analise/.test(t),commercial=/quanto (custa|fica|sai)|\bpreco\b|\bvalor\b|\borcamento\b|\bcomprar\b|\bcontratar\b|\bquero\b|\bagendar\b/.test(t),rejection=/nao quero|nao tenho interesse|desisti|nao preciso/.test(t);let status="Não é oportunidade",reason="Não há sinais suficientes de intenção comercial.",confidence=80;if(noReply){status="Sem resposta";reason="A mensagem indica explicitamente que a pessoa aguarda retorno.";confidence=90}else if(delay&&commercial){status="Orçamento parado";reason="Há interesse comercial, mas também adiamento ou decisão pendente.";confidence=86}else if(rejection){status="Não é oportunidade";reason="A mensagem contém sinal de recusa ou desinteresse.";confidence=90}else if(commercial&&product){status="Interessado";reason="Há intenção comercial e um produto/serviço cadastrado foi reconhecido.";confidence=84}else if(commercial){status="Revisar";reason="Há um possível sinal comercial, mas o contexto não confirma oportunidade com segurança.";confidence=58}const value=["Interessado","Orçamento parado","Sem resposta"].includes(status)&&product?Number(product.price):0;return {status,product:product?.name||"Não identificado",value,reason:reason+(product?` Produto reconhecido: ${product.name}.`:""),confidence}}

async function mpRequest(path,options={}){
 if(!MP_ACCESS_TOKEN) throw Object.assign(new Error("MERCADOPAGO_ACCESS_TOKEN não configurado."),{status:503});
 const r=await fetch(MP_API+path,{...options,headers:{"Content-Type":"application/json","Authorization":"Bearer "+MP_ACCESS_TOKEN,...(options.headers||{})}});
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e=new Error(data.message||data.error||`Mercado Pago respondeu ${r.status}`);e.status=r.status;throw e;}
 return data;
}

const MP_PLAN_IDS={
 RADAR_START:(process.env.MP_PLAN_RADAR_START||"").trim(),
 RADAR_PRO:(process.env.MP_PLAN_RADAR_PRO||"").trim(),
 RADAR_BUSINESS:(process.env.MP_PLAN_RADAR_BUSINESS||"").trim()
};
async function ensureMpPlan(plan){
 const configured=MP_PLAN_IDS[plan.code];
 if(configured){await pool.query("UPDATE plans SET mercadopago_plan_id=$1 WHERE id=$2",[configured,plan.id]);return configured;}
 const existing=await pool.query("SELECT mercadopago_plan_id FROM plans WHERE id=$1",[plan.id]);
 if(existing.rows[0]?.mercadopago_plan_id)return existing.rows[0].mercadopago_plan_id;
 if(!APP_URL || !/^https:\/\//i.test(APP_URL)) throw Object.assign(new Error("APP_URL precisa ser uma URL pública HTTPS da Vercel para usar o Mercado Pago."),{status:400});
 const mp=await mpRequest("/preapproval_plan",{method:"POST",body:JSON.stringify({reason:`${plan.name} - RADAR OPORTUNIDADES`,auto_recurring:{frequency:1,frequency_type:"months",free_trial:{frequency:1,frequency_type:"days"},transaction_amount:Number(plan.price),currency_id:"BRL"},back_url:`${APP_URL.replace(/\/$/,"")}/?payment=return`})});
 MP_PLAN_IDS[plan.code]=mp.id;
 await pool.query("UPDATE plans SET mercadopago_plan_id=$1 WHERE id=$2",[mp.id,plan.id]);
 return mp.id;
}

async function getMpPlan(planId){
 return mpRequest(`/preapproval_plan/${encodeURIComponent(planId)}`);
}

app.get("/api/plans",auth,async(req,res)=>{
 const q=await pool.query("SELECT id,code,name,price::float AS price,interval,active FROM plans WHERE active=TRUE ORDER BY price ASC");
 res.json(q.rows.map(p=>({ ...p,features:ruleFor(p.code) })));
});

app.get("/api/entitlements",auth,async(req,res)=>{try{res.json(await getEntitlements(req.user.id))}catch(e){res.status(500).json({error:"Não foi possível carregar os limites do plano."})}});

app.get("/api/subscription",auth,async(req,res)=>{
 const q=await pool.query(`SELECT s.id,s.status,s.mercadopago_preapproval_id,s.mercadopago_plan_id,s.created_at AS "createdAt",p.code,p.name,p.price::float AS price,p.interval FROM subscriptions s LEFT JOIN plans p ON p.id=s.plan_id WHERE s.user_id=$1 ORDER BY CASE WHEN LOWER(s.status) IN ('authorized','active') THEN 0 ELSE 1 END,s.created_at DESC LIMIT 1`,[req.user.id]);
 res.json(q.rows[0]||null);
});

app.post("/api/subscription/test",auth,async(req,res)=>{
 const host=String(req.headers.host||"").split(":")[0].toLowerCase(); const isLocalRequest=host==="localhost"||host==="127.0.0.1";
 if(!LOCAL_TEST_MODE&&!isLocalRequest)return res.status(403).json({error:"Modo de teste disponível somente no ambiente local."});
 const planCode=cleanText(req.body?.planCode,80)||"RADAR_PRO";
 const planQ=await pool.query("SELECT id,code,name,price::float AS price,interval FROM plans WHERE code=$1 AND active=TRUE LIMIT 1",[planCode]); const plan=planQ.rows[0];
 if(!plan)return res.status(404).json({error:"Plano não encontrado."});
 const old=(await pool.query(`SELECT id,mercadopago_preapproval_id FROM subscriptions WHERE user_id=$1 AND LOWER(status) IN ('authorized','active')`,[req.user.id])).rows;
 await pool.query(`UPDATE subscriptions SET status='cancelled',updated_at=NOW() WHERE user_id=$1 AND LOWER(status) IN ('authorized','active')`,[req.user.id]);
 const local=await pool.query(`INSERT INTO subscriptions(user_id,plan_id,status) VALUES($1,$2,'authorized') RETURNING id`,[req.user.id,plan.id]);
 await pool.query("UPDATE users SET trial_ends_at=NOW() WHERE id=$1",[req.user.id]);
 res.json({ok:true,mode:"test",subscriptionId:local.rows[0].id,status:"authorized",code:plan.code,name:plan.name,price:plan.price});
});

app.post("/api/subscription",auth,async(req,res)=>{
 const planCode=cleanText(req.body?.planCode,80)||"RADAR_PRO";
 const planQ=await pool.query("SELECT id,code,name,price::float AS price,interval,mercadopago_plan_id FROM plans WHERE code=$1 AND active=TRUE LIMIT 1",[planCode]);
 const plan=planQ.rows[0];
 if(!plan)return res.status(404).json({error:"Plano não encontrado."});
 const account=(await pool.query("SELECT id,email FROM users WHERE id=$1",[req.user.id])).rows[0];
 if(!account)return res.status(404).json({error:"Usuário não encontrado."});
 if(!MP_ACCESS_TOKEN)return res.status(503).json({error:"Configure MERCADOPAGO_ACCESS_TOKEN no Vercel antes de assinar."});
 try{
   const mpPlanId=await ensureMpPlan(plan);
   const mpPlan=await getMpPlan(mpPlanId);
   const local=await pool.query(`INSERT INTO subscriptions(user_id,plan_id,mercadopago_plan_id,status) VALUES($1,$2,$3,'pending') RETURNING id`,[account.id,plan.id,mpPlanId]);
   const initPoint=mpPlan.init_point||mpPlan.sandbox_init_point||null;
   if(!initPoint) throw Object.assign(new Error("O Mercado Pago não retornou o link de checkout do plano."),{status:502});
   res.json({ok:true,subscriptionId:local.rows[0].id,status:"pending",initPoint,mercadopagoPlanId:mpPlanId});
 }catch(e){res.status(e.status&&e.status<500?e.status:502).json({error:e.message||"Não foi possível iniciar a assinatura no Mercado Pago."});}
});

app.post("/api/subscription/sync",auth,async(req,res)=>{
 if(!MP_ACCESS_TOKEN)return res.status(503).json({error:"Configure MERCADOPAGO_ACCESS_TOKEN no Vercel antes de sincronizar a assinatura."});
 try{
   const localQ=await pool.query(`SELECT s.id,s.plan_id,s.mercadopago_plan_id,p.code,p.name,p.price::float AS price,p.interval FROM subscriptions s LEFT JOIN plans p ON p.id=s.plan_id WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,[req.user.id]);
   const local=localQ.rows[0];
   if(!local?.mercadopago_plan_id)return res.json({ok:false,subscription:local||null});
   const account=(await pool.query("SELECT email FROM users WHERE id=$1",[req.user.id])).rows[0];
   if(!account)return res.status(404).json({error:"Usuário não encontrado."});
   const qs=new URLSearchParams({payer_email:account.email,preapproval_plan_id:local.mercadopago_plan_id,limit:"20"});
   const found=await mpRequest(`/preapproval/search?${qs.toString()}`);
   const results=Array.isArray(found.results)?found.results:[];
   const mp=results.sort((a,b)=>new Date(b.date_created||0)-new Date(a.date_created||0))[0];
   if(mp?.id){
     const newStatus=mp.status||"pending";
     await pool.query("UPDATE subscriptions SET mercadopago_preapproval_id=$1,status=$2,updated_at=NOW() WHERE id=$3",[String(mp.id),newStatus,local.id]);
     local.mercadopago_preapproval_id=String(mp.id);local.status=newStatus;
     if(["authorized","active"].includes(String(newStatus).toLowerCase())){
       const oldSubs=(await pool.query("SELECT id,mercadopago_preapproval_id FROM subscriptions WHERE user_id=$1 AND id<>$2 AND LOWER(status) IN ('authorized','active')",[req.user.id,local.id])).rows;
       for(const oldSub of oldSubs){
         if(oldSub.mercadopago_preapproval_id){try{await mpRequest(`/preapproval/${encodeURIComponent(oldSub.mercadopago_preapproval_id)}`,{method:"PUT",body:JSON.stringify({status:"cancelled"})})}catch{}}
       }
       await pool.query("UPDATE subscriptions SET status='cancelled',updated_at=NOW() WHERE user_id=$1 AND id<>$2 AND LOWER(status) IN ('authorized','active')",[req.user.id,local.id]);
     }
   }
   res.json({ok:!!mp,subscription:local});
 }catch(e){res.status(e.status&&e.status<500?e.status:502).json({error:e.message||"Não foi possível sincronizar a assinatura."});}
});

app.delete("/api/subscription",auth,async(req,res)=>{
 const q=await pool.query(`SELECT id,mercadopago_preapproval_id FROM subscriptions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`,[req.user.id]);
 const sub=q.rows[0];
 if(!sub)return res.status(404).json({error:"Nenhuma assinatura encontrada."});
 try{
   if(sub.mercadopago_preapproval_id) await mpRequest(`/preapproval/${encodeURIComponent(sub.mercadopago_preapproval_id)}`,{method:"PUT",body:JSON.stringify({status:"cancelled"})});
   await pool.query("UPDATE subscriptions SET status='cancelled',updated_at=NOW() WHERE id=$1",[sub.id]);
   res.json({ok:true});
 }catch(e){res.status(e.status&&e.status<500?e.status:502).json({error:e.message||"Não foi possível cancelar a assinatura."});}
});

app.post("/api/webhooks/mercadopago",async(req,res)=>{
 // O Mercado Pago pode enviar notificações de diferentes tipos. Respondemos 200 rapidamente e,
 // quando houver um preapproval identificável, consultamos a API para atualizar o status.
 res.sendStatus(200);
 try{
   const id=req.body?.data?.id||req.query?.id;
   const type=req.body?.type||req.query?.type;
   if(!id || (type && !String(type).toLowerCase().includes("subscription") && !String(type).toLowerCase().includes("preapproval"))) return;
   const mp=await mpRequest(`/preapproval/${encodeURIComponent(id)}`);
   await pool.query("UPDATE subscriptions SET status=$1,updated_at=NOW() WHERE mercadopago_preapproval_id=$2",[mp.status||"unknown",String(id)]);
 }catch(e){console.error("[RADAR] Webhook Mercado Pago:",e.message);}
});

app.get("/health",async(req,res)=>{try{await pool.query("SELECT 1");res.json({ok:true,database:"connected",environment:NODE_ENV})}catch{res.status(503).json({ok:false,database:"disconnected"})}});
app.post("/api/register",async(req,res)=>{const name=cleanText(req.body?.name,120),email=cleanText(req.body?.email,254).toLowerCase(),password=String(req.body?.password||"");if(name.length<2||!validEmail(email)||password.length<8)return res.status(400).json({error:"Informe nome válido, e-mail válido e senha com pelo menos 8 caracteres."});const userId=id();const client=await pool.connect();try{const hash=await bcrypt.hash(password,12);await client.query("BEGIN");await client.query("INSERT INTO users(id,name,email,password_hash,trial_started_at,trial_ends_at) VALUES($1,$2,$3,$4,NOW(),NOW()+INTERVAL '1 day')",[userId,name,email,hash]);await client.query("INSERT INTO companies(user_id) VALUES($1)",[userId]);await client.query("COMMIT")}catch(e){await client.query("ROLLBACK").catch(()=>{});if(e.code==="23505")return res.status(409).json({error:"Este e-mail já possui uma conta."});throw e}finally{client.release()}const user=await getPublicUser(userId);const token=jwt.sign({id:user.id,email:user.email},SECRET,{algorithm:"HS256",expiresIn:"8h"});res.status(201).json({token,user})});
app.post("/api/login",async(req,res)=>{const email=cleanText(req.body?.email,254).toLowerCase(),password=String(req.body?.password||"");const q=await pool.query("SELECT id,email,password_hash,trial_ends_at FROM users WHERE email=$1",[email]);const u=q.rows[0];if(!u||!(await bcrypt.compare(password,u.password_hash)))return res.status(401).json({error:"E-mail ou senha incorretos."});if(!u.trial_ends_at)await pool.query("UPDATE users SET trial_started_at=COALESCE(trial_started_at,NOW()),trial_ends_at=NOW()+INTERVAL '1 day' WHERE id=$1",[u.id]);const user=await getPublicUser(u.id);const token=jwt.sign({id:user.id,email:user.email},SECRET,{algorithm:"HS256",expiresIn:"8h"});res.json({token,user})});
app.get("/api/me",auth,async(req,res)=>{const u=await getPublicUser(req.user.id);if(!u)return res.status(404).json({error:"Usuário não encontrado."});res.json({user:u})});
app.put("/api/company",auth,requireAccess,async(req,res)=>{const c={name:cleanText(req.body?.name,120),segment:cleanText(req.body?.segment,80),website:cleanText(req.body?.website,300),whatsappLink:cleanText(req.body?.whatsappLink,300)};if(!validUrl(c.website)||!validUrl(c.whatsappLink))return res.status(400).json({error:"Links devem começar com http:// ou https://"});await pool.query(`INSERT INTO companies(user_id,name,segment,website,whatsapp_link) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id) DO UPDATE SET name=EXCLUDED.name,segment=EXCLUDED.segment,website=EXCLUDED.website,whatsapp_link=EXCLUDED.whatsapp_link,updated_at=NOW()`,[req.user.id,c.name,c.segment,c.website,c.whatsappLink]);res.json({company:c})});
app.put("/api/whatsapp-settings",auth,requireAccess,async(req,res)=>{const loadHistory=req.body?.loadHistory!==false;await pool.query(`INSERT INTO companies(user_id,name,segment,website,whatsapp_link,whatsapp_load_history) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id) DO UPDATE SET whatsapp_load_history=EXCLUDED.whatsapp_load_history,updated_at=NOW()`,[req.user.id,"","","","",loadHistory]);res.json({whatsappLoadHistory:loadHistory})});
app.get("/api/products",auth,requireAccess,async(req,res)=>res.json((await pool.query("SELECT id,name,description,price::float AS price FROM products WHERE user_id=$1 ORDER BY created_at DESC",[req.user.id])).rows));
app.post("/api/products",auth,requireAccess,requireProductCapacity,async(req,res)=>{const name=cleanText(req.body?.name,120),description=cleanText(req.body?.description,500),price=Number(String(req.body?.price??"").replace(/[^\d,.-]/g,"").replace(/\.(?=.*\.)/g,"").replace(",","."));if(!name||!Number.isFinite(price)||price<=0||price>1e9)return res.status(400).json({error:"Informe nome e preço válido."});const p={id:id(),name,description,price};await pool.query("INSERT INTO products(id,user_id,name,description,price) VALUES($1,$2,$3,$4,$5)",[p.id,req.user.id,p.name,p.description,p.price]);res.status(201).json(p)});
app.delete("/api/products/:id",auth,async(req,res)=>{await pool.query("DELETE FROM products WHERE id=$1 AND user_id=$2",[req.params.id,req.user.id]);res.json({ok:true})});
app.get("/api/messages",auth,requireAccess,async(req,res)=>{const e=await getEntitlements(req.user.id);res.json((await pool.query("SELECT id,customer,message,product,value::float AS value,status,reason,confidence,created_at AS \"createdAt\" FROM messages WHERE user_id=$1 AND created_at>=NOW()-($2 * INTERVAL '1 day') ORDER BY created_at DESC LIMIT 500",[req.user.id,e.historyDays])).rows)});
app.post("/api/analyze",auth,requireAccess,requireMessageCapacity,async(req,res)=>{const customer=cleanText(req.body?.customer,120),message=cleanText(req.body?.message,5000);if(!customer||!message)return res.status(400).json({error:"Informe cliente e mensagem."});const products=(await pool.query("SELECT name,price::float AS price FROM products WHERE user_id=$1",[req.user.id])).rows,result=classify(message,products),item={id:id(),customer,message,...result,createdAt:new Date().toISOString()};await pool.query("INSERT INTO messages(id,user_id,customer,message,product,value,status,reason,confidence,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[item.id,req.user.id,item.customer,item.message,item.product,item.value,item.status,item.reason,item.confidence,item.createdAt]);res.json(item)});
app.post("/api/import-messages",auth,requireAccess,async(req,res)=>{const input=req.body?.messages;if(!Array.isArray(input)||!input.length)return res.status(400).json({error:"Nenhuma mensagem encontrada."});if(input.length>1000)return res.status(400).json({error:"Máximo de 1.000 mensagens por importação."});const ent=await getEntitlements(req.user.id);const batchLimit=ent.planCode==="RADAR_START"?100:ent.planCode==="RADAR_PRO"?500:1000;if(input.length>batchLimit)return res.status(429).json({error:`Seu plano permite importar até ${batchLimit.toLocaleString("pt-BR")} mensagens por vez. Faça upgrade para aumentar o limite.`,code:"IMPORT_LIMIT",limit:batchLimit});const remaining=ent.messageLimit-ent.messagesUsed;if(remaining<=0)return res.status(429).json({error:`Você atingiu o limite de ${ent.messageLimit.toLocaleString('pt-BR')} mensagens analisadas neste mês. Faça upgrade do plano para continuar.`,code:"MESSAGE_LIMIT",limit:ent.messageLimit,used:ent.messagesUsed});if(input.length>remaining)return res.status(429).json({error:`Seu plano permite mais ${remaining.toLocaleString('pt-BR')} análises neste mês. Faça upgrade para importar mais mensagens.`,code:"MESSAGE_LIMIT",limit:ent.messageLimit,used:ent.messagesUsed,remaining});const products=(await pool.query("SELECT name,price::float AS price FROM products WHERE user_id=$1",[req.user.id])).rows,created=[];const client=await pool.connect();try{await client.query("BEGIN");for(const raw of input){const customer=cleanText(raw?.customer||"Cliente",120),message=cleanText(raw?.message,5000);if(!message)continue;const result=classify(message,products),item={id:id(),customer,message,...result,createdAt:new Date().toISOString()};created.push(item);await client.query("INSERT INTO messages(id,user_id,customer,message,product,value,status,reason,confidence,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",[item.id,req.user.id,item.customer,item.message,item.product,item.value,item.status,item.reason,item.confidence,item.createdAt])}await client.query("COMMIT")}catch(e){await client.query("ROLLBACK");throw e}finally{client.release()}res.json({imported:created.length,items:created})});
app.post("/api/ai-reply",auth,requireAccess,async(req,res)=>{
 const e=await getEntitlements(req.user.id); if(!e.aiReply)return res.status(403).json({error:"Sugestões de resposta por IA estão disponíveis a partir do Radar Pro.",code:"PLAN_FEATURE",requiredPlan:"RADAR_PRO"});
 const customer=cleanText(req.body?.customer||"cliente",120); const message=cleanText(req.body?.message,5000); if(!message)return res.status(400).json({error:"Informe a mensagem do cliente."});
 res.json({reply:`Olá, ${customer}! Tudo bem? 😊 Recebemos sua mensagem e queremos ajudar. Podemos continuar seu atendimento por aqui?`});
});

app.use((err,req,res,next)=>{console.error(`[${new Date().toISOString()}]`,err.message);if(res.headersSent)return next(err);res.status(err.status||500).json({error:err.status&&err.status<500?err.message:"Erro interno do servidor."})});
const dbReady=initDb().catch(err=>{console.error("Falha ao iniciar PostgreSQL:",err.message);throw err});
export {app,dbReady};
if(!process.env.VERCEL){dbReady.then(()=>app.listen(PORT,()=>console.log(`RADAR V8 API em execução na porta ${PORT} com PostgreSQL`))).catch(()=>process.exit(1));}
