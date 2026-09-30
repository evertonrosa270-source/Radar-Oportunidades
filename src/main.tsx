import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{LayoutDashboard,MessageSquare,Package,Building2,LogOut,Plus,Trash2,Link2,Menu,X,MessageCircle,FlaskConical,ChevronDown,ChevronUp,Brain,CreditCard,Info as InfoIcon,Clock3,Sparkles,Zap,BarChart3,CheckCircle2}from"lucide-react";
import"./styles.css";
const API=(import.meta.env.VITE_API_URL||"/api").replace(/\/$/,"");
const GOOGLE_CLIENT_ID=String(import.meta.env.VITE_GOOGLE_CLIENT_ID||"").trim();
const LOCAL_TEST_MODE=String(import.meta.env.VITE_LOCAL_TEST||"").toLowerCase()==="true" || window.location.hostname==="localhost" || window.location.hostname==="127.0.0.1";
const money=(n:number)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
type User={name:string,email:string;access?:any;company:{name:string;segment:string;website:string;whatsappLink:string;whatsappPhoneNumberId?:string;whatsappBusinessAccountId?:string;whatsappConnectedAt?:string|null}};
type Product={id:number|string;name:string;description:string;price:number};
type Msg={id:number;customer:string;message:string;product:string;value:number;status:string;reason?:string;confidence?:number;createdAt:string};
declare global { interface Window { google?: any } }

function App(){
 const[token,setToken]=useState(localStorage.getItem("radar_token")||"");const[user,setUser]=useState<User|null>(null);
 const[page,setPage]=useState("dashboard");const[mobile,setMobile]=useState(false);const[mode,setMode]=useState<"login"|"register">("login");
 const[error,setError]=useState("");const[googleClientId,setGoogleClientId]=useState(GOOGLE_CLIENT_ID);const googleButtonRef=useRef<HTMLDivElement|null>(null);const[whatsappHistoryEnabled,setWhatsappHistoryEnabled]=useState(true);const[whatsappConfigured,setWhatsappConfigured]=useState(false);const[whatsappConnected,setWhatsappConnected]=useState(false);const[whatsappDiag,setWhatsappDiag]=useState<any>(null);const[whatsappPhoneNumberId,setWhatsappPhoneNumberId]=useState("");const[whatsappBusinessAccountId,setWhatsappBusinessAccountId]=useState("");const[plans,setPlans]=useState<any[]>([]);const[subscription,setSubscription]=useState<any|null>(null);const[entitlements,setEntitlements]=useState<any|null>(null);const[billingLoading,setBillingLoading]=useState(false);const[products,setProducts]=useState<Product[]>([]);const[msgs,setMsgs]=useState<Msg[]>([]);const[notice,setNotice]=useState("");
 const headers=()=>({"Content-Type":"application/json","Authorization":"Bearer "+token});
 async function load(){
  if(!token)return;
  try{
    const me=await fetch(API+"/me",{headers:headers()});
    const meJson=await me.json().catch(()=>({}));
    if(!me.ok){
      if(me.status===401||me.status===403||me.status===404){
        localStorage.removeItem("radar_token");
        setToken("");
        setUser(null);
      }else{
        setError(meJson.error||"Não foi possível carregar sua conta.");
      }
      return;
    }
    setUser(meJson.user);
    setWhatsappPhoneNumberId(meJson.user.company?.whatsappPhoneNumberId||"");
    setWhatsappBusinessAccountId(meJson.user.company?.whatsappBusinessAccountId||"");
    const waStatus=await fetch(API+"/whatsapp-status",{headers:headers()});
    if(waStatus.ok){const wa=await waStatus.json().catch(()=>({}));setWhatsappConfigured(!!wa.configured);setWhatsappConnected(!!wa.connected);setWhatsappDiag(wa);if(!meJson.user.company?.whatsappPhoneNumberId&&wa.phoneNumberId)setWhatsappPhoneNumberId(wa.phoneNumberId);if(!meJson.user.company?.whatsappBusinessAccountId&&wa.businessAccountId)setWhatsappBusinessAccountId(wa.businessAccountId);}
    setWhatsappHistoryEnabled(meJson.user.company?.whatsappLoadHistory !== false);
    if(meJson.user?.access)setEntitlements(meJson.user.access);
    const productsRes=await fetch(API+"/products",{headers:headers()});
    if(productsRes.ok){
      const data=await productsRes.json().catch(()=>[]);
      setProducts(Array.isArray(data)?data:[]);
    }

    const messagesRes=await fetch(API+"/messages",{headers:headers()});
    if(messagesRes.ok){
      const data=await messagesRes.json().catch(()=>[]);
      setMsgs(Array.isArray(data)?data:[]);
    }
  }catch{
    setError("Não foi possível conectar ao servidor. A sessão foi mantida.");
  }
}
 useEffect(()=>{load()},[token]);
 useEffect(()=>{if(user)loadBilling()},[user]);
 useEffect(()=>{
  if(!user||!token)return;
  const params=new URLSearchParams(window.location.search);
  if(params.get("payment")==="return"){
   setPage("billing");
   setNotice("Confirmando sua assinatura com o Mercado Pago...");
   fetch(API+"/subscription/sync",{method:"POST",headers:headers()})
    .then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||"Não foi possível confirmar a assinatura.");return j;})
    .then(j=>{if(j?.subscription?.status&&["authorized","active"].includes(String(j.subscription.status).toLowerCase()))setNotice("Assinatura confirmada e plano ativado na sua conta.");else if(j?.subscription)setNotice("Pagamento retornou. Aguardando a confirmação do Mercado Pago; atualize o status em instantes.");else setNotice("Ainda não encontramos uma assinatura confirmada. Se o pagamento já foi aprovado, aguarde alguns segundos e atualize o status.");return loadBilling(false);})
    .catch(e=>setNotice(e.message||"Não foi possível confirmar a assinatura."))
    .finally(()=>window.history.replaceState({},document.title,window.location.pathname));
  }
 },[user,token]);
 useEffect(()=>{if(user && user.access && !user.access.canUse)setPage("billing")},[user]);
 async function login(e:any){e.preventDefault();setError("");const f=new FormData(e.currentTarget),body=mode==="login"?{email:f.get("email"),password:f.get("password")}:{name:f.get("name"),email:f.get("email"),password:f.get("password")};try{const r=await fetch(API+"/"+(mode==="login"?"login":"register"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok){setError(j.error||"Não foi possível entrar.");return}if(!j.token){setError("O servidor não retornou uma sessão válida.");return}localStorage.setItem("radar_token",j.token);setToken(j.token)}catch{setError("Não foi possível conectar ao servidor. Verifique a API e a conexão.")}}
 async function loginGoogle(credential:string){setError("");try{const r=await fetch(API+"/auth/google",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({credential})});const j=await r.json().catch(()=>({}));if(!r.ok){setError(j.error||"Não foi possível entrar com Google.");return}if(!j.token){setError("O servidor não retornou uma sessão válida.");return}localStorage.setItem("radar_token",j.token);setToken(j.token)}catch{setError("Não foi possível conectar ao servidor.")}}
 useEffect(()=>{
  if(token||googleClientId)return;
  let cancelled=false;
  fetch(API+"/config")
    .then(r=>r.ok?r.json():null)
    .then(j=>{if(!cancelled&&j?.googleClientId)setGoogleClientId(String(j.googleClientId).trim())})
    .catch(()=>{});
  return()=>{cancelled=true};
},[token,googleClientId]);
 useEffect(()=>{if(token||!googleClientId)return;let script=document.querySelector('script[data-radar-google="1"]') as HTMLScriptElement|null;const render=()=>{if(!window.google||!googleButtonRef.current)return;googleButtonRef.current.innerHTML="";window.google.accounts.id.initialize({client_id:googleClientId,callback:(response:any)=>{if(response?.credential)loginGoogle(response.credential)},auto_select:false});window.google.accounts.id.renderButton(googleButtonRef.current,{theme:"outline",size:"large",shape:"rectangular",text:"continue_with",logo_alignment:"left",width:340});};if(script){if(window.google)render();else script.addEventListener("load",render,{once:true})}else{script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;script.defer=true;script.dataset.radarGoogle="1";script.onload=render;document.head.appendChild(script)}return()=>{try{window.google?.accounts?.id?.cancel()}catch{}}},[token,mode,googleClientId]);
 if(!token)return <div className="lp"><header className="lp-nav"><div className="lp-brand"><div className="mark">R$</div><b>RADAR</b><span className="lp-beta">Beta</span></div><nav><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="#seguranca">Segurança</a><a href="#faq">Perguntas frequentes</a></nav></header><main>
<section className="lp-hero"><div className="lp-copy"><h1>Nenhum cliente ficando sem resposta no seu WhatsApp.</h1><p>O RADAR analisa as mensagens recebidas no WhatsApp Business da sua empresa, separa quem pediu orçamento, quem ficou sem resposta e quem demonstrou interesse, e mostra quanto dinheiro está em jogo em cada conversa.</p><ul className="lp-checks"><li>Conexão pela API oficial da Meta, sem QR code e sem robôs</li><li>Valor estimado a partir do seu catálogo de produtos e preços</li><li>Entrada rápida com a sua conta Google</li></ul></div>
<form onSubmit={login} className="authcard lp-auth"><div className="mark">R$</div><h2>{mode==="login"?"Entrar no RADAR":"Criar conta gratuita"}</h2><p>{mode==="login"?"Acesse o painel da sua empresa.":"Comece com 3 dias de teste gratuito."}</p>{googleClientId&&<><div ref={googleButtonRef} className="google-button"></div><div className="auth-divider"><span>ou</span></div></>}{mode==="register"&&<input name="name" placeholder="Seu nome" required/>}<input name="email" placeholder="E-mail" type="email" required/><input name="password" placeholder="Senha (mínimo 8)" type="password" required/><button className="primary">{mode==="login"?"Entrar":"Criar conta"}</button>{error&&<div className="error">{error}</div>}<button type="button" className="link" onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}>{mode==="login"?"Criar minha conta":"Já tenho uma conta"}</button></form></section>
<section className="lp-sec"><h2>O painel, em um exemplo</h2><p className="lp-sub">Ilustração com dados fictícios, só para mostrar como as oportunidades aparecem.</p><div className="lp-mock" role="img" aria-label="Exemplo ilustrativo do painel do RADAR com dados fictícios"><div className="lp-mock-top"><span>Valor total identificado</span><b>R$ 12.480</b><small>23 mensagens analisadas</small></div><div className="lp-mock-cols">{[["Sem resposta","5","Cliente exemplo A","“Oi, vocês têm o plano anual? Qual o valor?”","R$ 2.400"],["Orçamento parado","3","Cliente exemplo B","“Recebi o orçamento, vou ver com meu sócio.”","R$ 5.900"],["Interessado","7","Cliente exemplo C","“Quero saber mais sobre a instalação.”","R$ 1.180"]].map(c=><div className="lp-mock-card" key={c[0]}><div className="lp-mock-h"><span>{c[0]}</span><i>{c[1]}</i></div><b>{c[2]}</b><p>{c[3]}</p><em>{c[4]}</em></div>)}</div></div></section>
<section className="lp-sec" id="como-funciona"><h2>Como funciona</h2><ol className="lp-steps">{[["Conecte o WhatsApp Business","Informe o Phone Number ID da sua conta na Meta. O token da API fica guardado apenas no servidor."],["O RADAR analisa cada mensagem","As mensagens recebidas são lidas, classificadas e ligadas ao produto e ao valor correspondentes."],["Você age onde há dinheiro parado","Veja as oportunidades por grupo, gere uma sugestão de resposta e abra a conversa no seu WhatsApp."]].map((x,n)=><li key={n}><b>{x[0]}</b><p>{x[1]}</p></li>)}</ol></section>
<section className="lp-sec" id="recursos"><h2>O que você encontra dentro</h2><div className="lp-grid">{[["Oportunidades agrupadas","Sem resposta, orçamento parado e interessado, cada um no seu grupo, com o motivo da classificação."],["Catálogo de produtos e preços","Cadastre o que vende. O RADAR identifica o produto citado e estima o valor da oportunidade."],["Visão geral","O total identificado e a contagem por situação, para decidir o que atender primeiro."],["Resposta sugerida","Uma sugestão de texto para cada conversa, que você revisa e envia pelo seu WhatsApp. Com IA nos planos que incluem o recurso."],["Laboratório IA","Cole uma mensagem qualquer e veja como o RADAR a classificaria, útil para conhecer o comportamento antes de conectar."],["Assinatura simples","Teste gratuito ao criar a conta e planos pagos via Mercado Pago, que você acompanha dentro do painel."]].map(x=><article key={x[0]}><b>{x[0]}</b><p>{x[1]}</p></article>)}</div></section>
<section className="lp-sec" id="seguranca"><h2>Privacidade e segurança</h2><div className="lp-grid two">{[["Conexão oficial","Usamos a WhatsApp Business Platform da Meta. Não pedimos a senha do seu WhatsApp nem usamos automações não oficiais."],["Token protegido","A credencial da API fica em variáveis do servidor e nunca aparece na tela nem no navegador."],["Dados separados por conta","Cada conta enxerga apenas as próprias mensagens, produtos e configurações."],["Acesso com Google","Você pode entrar com a sua conta Google, sem criar mais uma senha para lembrar."]].map(x=><article key={x[0]}><b>{x[0]}</b><p>{x[1]}</p></article>)}</div><p className="lp-note">O RADAR está em fase beta e evolui a cada versão. Se você tiver dúvidas sobre o tratamento de dados, fale com a gente antes de conectar a sua conta.</p></section>
<section className="lp-sec" id="faq"><h2>Perguntas frequentes</h2><div className="lp-faq">{[["Preciso ter o WhatsApp Business API?","Sim. O RADAR se conecta à Cloud API oficial da Meta, e você informa o Phone Number ID da sua conta."],["O RADAR importa conversas antigas?","As mensagens novas são recebidas em tempo real. O histórico só entra se a Meta o disponibilizar para o seu número."],["O RADAR responde os clientes por mim?","Não. Ele identifica oportunidades e sugere respostas. Quem envia é você, pelo seu próprio WhatsApp."],["Posso testar antes de pagar?","Sim. Ao criar a conta você começa com 3 dias de teste gratuito e vê os planos dentro do painel."]].map(x=><details key={x[0]}><summary>{x[0]}</summary><p>{x[1]}</p></details>)}</div></section></main><footer className="lp-foot"><b>RADAR Oportunidades</b><span>Versão beta · inteligência comercial para mensagens de clientes</span><span><a href="/politica-de-privacidade/">Política de Privacidade</a> · <a href="/termos-de-servico/">Termos de Serviço</a></span></footer></div>;
 if(!user)return <div className="loading">Carregando...</div>;
 const total=msgs.reduce((s,m)=>s+m.value,0);
 const accessLocked=!!(user.access && !user.access.canUse);
 const nav=[["dashboard","Visão geral",LayoutDashboard],["messages","Oportunidades",MessageSquare],["lab","Laboratório IA",FlaskConical],["products","Produtos e preços",Package],["connections","WhatsApp Business",MessageCircle],["company","Minha empresa",Building2],["billing","Assinatura",CreditCard],["about","Sobre o RADAR",InfoIcon]];
 async function loadBilling(showLoading=true){
  if(showLoading)setBillingLoading(true);
  setNotice("");
  try{
   const [pr,sr,er]=await Promise.all([fetch(API+"/plans",{headers:headers()}),fetch(API+"/subscription",{headers:headers()}),fetch(API+"/entitlements",{headers:headers()})]);
   const pj=await pr.json().catch(()=>({}));
   let sj=await sr.json().catch(()=>null);
   if(!pr.ok){setNotice(pj.error||"Não foi possível carregar os planos.");setPlans([])}else{setPlans(Array.isArray(pj)?pj:[])}
   if(sr.ok&&sj?.status==="pending"&&sj?.mercadopago_plan_id){
    const sync=await fetch(API+"/subscription/sync",{method:"POST",headers:headers()});
    const syncJson=await sync.json().catch(()=>({}));
    if(sync.ok&&syncJson?.subscription)sj=syncJson.subscription;
   }
   if(sr.ok)setSubscription(sj);else setSubscription(null);
   if(er.ok){const ej=await er.json().catch(()=>null);if(ej)setEntitlements(ej);}
  }catch{setNotice("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");}
  finally{if(showLoading)setBillingLoading(false);}
 }
 async function subscribe(planCode:string){
  setNotice("");
  try{
   const endpoint=LOCAL_TEST_MODE?API+"/subscription/test":API+"/subscription";
   const r=await fetch(endpoint,{method:"POST",headers:headers(),body:JSON.stringify({planCode})});
   const j=await r.json().catch(()=>({}));
   if(!r.ok){setNotice(j.error||"Não foi possível iniciar a assinatura.");return;}
   if(LOCAL_TEST_MODE){setNotice("Assinatura de teste ativada. Nenhuma cobrança foi realizada.");await loadBilling();await load();return;}
   if(j.initPoint){window.location.href=j.initPoint;return;}
   setNotice("Assinatura criada, mas o Mercado Pago não retornou o link de pagamento.");
  }catch{setNotice("Não foi possível conectar ao servidor.")}
 }
 async function cancelSubscription(){
  if(!confirm("Cancelar sua assinatura?"))return;
  const r=await fetch(API+"/subscription",{method:"DELETE",headers:headers()});
  const j=await r.json().catch(()=>({}));
  setNotice(r.ok?"Assinatura cancelada.":(j.error||"Não foi possível cancelar."));
  if(r.ok)loadBilling();
 }
 async function addProduct(e:any){
  e.preventDefault();
  setNotice("");
  const form=e.currentTarget;
  const f=new FormData(form);
  try{
    const r=await fetch(API+"/products",{
      method:"POST",
      headers:headers(),
      body:JSON.stringify({
        name:String(f.get("name")||"").trim(),
        description:String(f.get("description")||"").trim(),
        price:String(f.get("price")||"")
      })
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok){setNotice(j.error||"Não foi possível adicionar o produto.");return;}
    form.reset();
    setNotice("Produto adicionado com sucesso.");
    await load();
  }catch{
    setNotice("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");
  }
}
 async function analyze(customer:string,message:string){const r=await fetch(API+"/analyze",{method:"POST",headers:headers(),body:JSON.stringify({customer,message})});const j=await r.json();if(r.ok){load();return j}return null}
 async function fetchAiReply(customer:string,message:string){try{const r=await fetch(API+"/ai-reply",{method:"POST",headers:headers(),body:JSON.stringify({customer,message})});const j=await r.json().catch(()=>({}));if(!r.ok)return null;return j.reply||null}catch{return null}}
 async function analyzeForm(e:any){e.preventDefault();const f=new FormData(e.currentTarget);await analyze(String(f.get("customer")),String(f.get("message")));e.currentTarget.reset()}
 async function saveWhatsappSettings(loadHistory:boolean){setNotice("");try{const r=await fetch(API+"/whatsapp-settings",{method:"PUT",headers:headers(),body:JSON.stringify({loadHistory})});const j=await r.json().catch(()=>({}));if(!r.ok){setNotice(j.error||"Não foi possível salvar a configuração do WhatsApp.");return}setNotice(loadHistory?"Configuração salva: carregar mensagens anteriores e novas.":"Configuração salva: somente mensagens novas.");await load()}catch{setNotice("Não foi possível conectar ao servidor.")}}
 async function saveWhatsappConnection(e:any){
  e.preventDefault();setNotice("");
  try{
    const r=await fetch(API+"/whatsapp-connection",{method:"PUT",headers:headers(),body:JSON.stringify({phoneNumberId:whatsappPhoneNumberId,businessAccountId:whatsappBusinessAccountId})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){setNotice(j.error||"Não foi possível ativar a integração do WhatsApp Business.");return}
    setWhatsappConnected(true);setNotice("WhatsApp Business conectado ao RADAR. O webhook poderá entregar as mensagens recebidas.");await load();
  }catch{setNotice("Não foi possível conectar ao servidor.")}
 }
 async function saveCompany(e:any){e.preventDefault();setNotice("");const f=new FormData(e.currentTarget);const r=await fetch(API+"/company",{method:"PUT",headers:headers(),body:JSON.stringify({name:f.get("name"),segment:f.get("segment"),website:f.get("website"),whatsappLink:f.get("whatsappLink")})});if(r.ok){setNotice("Dados salvos com sucesso.");load()}}

 const trialEnds=entitlements?.trialEndsAt?new Date(entitlements.trialEndsAt):null;
 const trialRemaining=trialEnds?Math.max(0,trialEnds.getTime()-Date.now()):0;
 const trialDays=Math.ceil(trialRemaining/86400000);
 const trialHours=Math.ceil(trialRemaining/3600000);
 const trialMessage=entitlements?.trialActive?`Free Trial — ${trialDays} ${trialDays===1?"dia":"dias"} grátis. ${trialDays<=1?`Restam aproximadamente ${trialHours} hora${trialHours===1?"":"s"}.`:"Aproveite seu período de teste."}`:"";
 const subscriptionStatus=String(subscription?.status||"").toLowerCase();
 const subscriptionStatusLabel=subscriptionStatus==="authorized"||subscriptionStatus==="active"?"Ativa":subscriptionStatus==="pending"?"Aguardando confirmação":subscriptionStatus==="cancelled"?"Cancelada":subscriptionStatus==="paused"?"Pausada":subscriptionStatus||"Sem assinatura";
 const trialBenefits=[
  ["Análise de oportunidades","200 mensagens/mês",MessageSquare],
  ["Catálogo","Até 20 produtos/serviços",Package],
  ["Histórico","7 dias",Clock3],
  ["IA","Recursos básicos",Sparkles]
 ];
 let content:any;
 if(page==="billing")content=<><Head t={accessLocked?"Escolha seu plano para continuar":"Assinatura"} p={accessLocked?"Seu período gratuito terminou. Escolha um plano para continuar usando o RADAR.":"Controle seu plano, acompanhe o consumo e veja o status da sua assinatura em um só lugar."}/>
   {LOCAL_TEST_MODE&&<div className="test-mode-badge">🧪 MODO TESTE — nenhuma cobrança real</div>}
   {trialMessage&&<div className="billing-trial-hero"><div className="billing-trial-icon"><Clock3 size={25}/></div><div className="billing-trial-copy"><span className="eyebrow">PERÍODO GRATUITO</span><h3>{trialMessage}</h3><p>Seu teste usa limites próprios de avaliação e <strong>não libera os 5.000 créditos do Radar Pro</strong>.</p></div><button type="button" className="primary" onClick={()=>{const el=document.getElementById("plans");el?.scrollIntoView({behavior:"smooth",block:"start"})}}>Ver planos</button></div>}
   {trialMessage&&<div className="trial-benefits">{trialBenefits.map(([title,value,Icon]:any)=><div key={title as string}><Icon size={18}/><span><b>{title}</b><small>{value}</small></span></div>)}</div>}
   {subscription&&<div className={`subscription-status ${subscriptionStatus==="authorized"||subscriptionStatus==="active"?"status-active":""}`}><div className="subscription-status-icon"><CheckCircle2 size={19}/></div><div className="subscription-main"><b>{subscription.name||"Plano contratado"}</b><span>Status: {subscriptionStatusLabel}{subscription.createdAt?` · desde ${new Date(subscription.createdAt).toLocaleDateString("pt-BR")}`:""}</span></div>{(subscriptionStatus==="authorized"||subscriptionStatus==="active"||subscriptionStatus==="pending")&&<button type="button" onClick={()=>loadBilling()}>Atualizar status</button>}{subscriptionStatus!=="cancelled"&&subscriptionStatus!=="pending"&&<button type="button" className="danger-outline" onClick={cancelSubscription}>Cancelar</button>}</div>}
   {entitlements&&<div className="usage-panel"><div className="usage-heading"><div><span className="eyebrow">SEU CONSUMO</span><h3>{entitlements.planName||"Sem plano"}</h3></div><span className="usage-status"><ShieldCheck size={15}/>{entitlements.paidActive?"Plano ativo":entitlements.trialActive?"Em período de teste":"Acesso bloqueado"}</span></div><div className="usage-grid"><div className="usage-item"><div className="usage-item-top"><MessageSquare size={18}/><span>Mensagens</span><b>{entitlements.messagesUsed?.toLocaleString("pt-BR")} / {entitlements.messageLimit?.toLocaleString("pt-BR")}</b></div><div className="usage-track"><i style={{width:`${Math.min(100,((entitlements.messagesUsed||0)/(entitlements.messageLimit||1))*100)}%`}}/></div></div><div className="usage-item"><div className="usage-item-top"><Package size={18}/><span>Produtos</span><b>{entitlements.productsUsed?.toLocaleString("pt-BR")} / {entitlements.productLimit?.toLocaleString("pt-BR")}</b></div><div className="usage-track"><i style={{width:`${Math.min(100,((entitlements.productsUsed||0)/(entitlements.productLimit||1))*100)}%`}}/></div></div></div></div>}
   <div className="plans-header" id="plans"><div><span className="eyebrow">PLANOS RADAR</span><h3>Escolha o nível certo para sua operação</h3><p>Comece pequeno, evolua quando o volume crescer e mantenha seus limites sempre claros.</p></div><div className="plans-trust"><ShieldCheck size={17}/><span>Checkout seguro pelo Mercado Pago</span></div></div>
   {billingLoading?<div className="card empty">Carregando planos...</div>:<div className="plans">{plans.length?plans.map((p:any)=>{const active=subscription&&(subscriptionStatus==="authorized"||subscriptionStatus==="active")&&subscription.code===p.code;const f=p.features||{};const featured=p.code==="RADAR_PRO";const PlanIcon=p.code==="RADAR_START"?Zap:p.code==="RADAR_PRO"?Sparkles:BarChart3;return <div className={`plan ${featured?"plan-featured":""} ${active?"plan-current":""}`} key={p.id}>{featured&&<div className="featured-ribbon"><Sparkles size={13}/> MAIS ESCOLHIDO</div>}{active&&<span className="current-badge">SEU PLANO ATUAL</span>}<div className="plan-topline"><div className="plan-icon"><PlanIcon size={20}/></div><span className="plan-badge">{p.code==="RADAR_BUSINESS"?"EMPRESAS":p.code==="RADAR_PRO"?"PROFISSIONAL":"INICIAL"}</span></div><h3>{p.name}</h3><div className="plan-price">{money(p.price)}<small>/mês</small></div><p>{p.code==="RADAR_START"?"Para organizar e identificar oportunidades com simplicidade.":p.code==="RADAR_PRO"?"Para transformar mensagens em vendas com inteligência avançada.":"Para equipes e operações com alto volume de oportunidades."}</p><ul className="plan-features"><li><CheckCircle2 size={15}/> {f.messageLimit?.toLocaleString("pt-BR")} mensagens analisadas/mês</li><li><CheckCircle2 size={15}/> Até {f.productLimit?.toLocaleString("pt-BR")} produtos/serviços</li><li><CheckCircle2 size={15}/> IA {f.aiLevel}</li><li><CheckCircle2 size={15}/> Histórico de {f.historyDays} dias</li><li><CheckCircle2 size={15}/> Importação de até {p.code==="RADAR_START"?100:p.code==="RADAR_PRO"?500:1000} mensagens por vez</li><li>{f.aiReply?<CheckCircle2 size={15}/>:<span className="feature-off">—</span>} Sugestões de resposta com IA</li></ul><button type="button" className={active?"secondary":"primary"} onClick={()=>subscribe(p.code)} disabled={active}>{active?"Plano atual":subscription&&(subscriptionStatus==="authorized"||subscriptionStatus==="active")?`Mudar para ${p.name}`:"Assinar agora"}</button></div>}) : <div className="card empty">Nenhum plano disponível.</div>}</div>}
   {notice&&<div className="notice notice-error">{notice}</div>}
   <div className="billing-help"><div><ShieldCheck size={20}/><div><b>Como a ativação funciona</b><span>Você é enviado ao checkout do Mercado Pago. Após a aprovação, o RADAR confirma a assinatura e ativa o plano na sua conta. Se a confirmação demorar, use “Atualizar status”.</span></div></div><div><Users size={20}/><div><b>Troca de plano</b><span>A nova assinatura passa a ser a referência ativa e a anterior é cancelada pelo RADAR quando a confirmação chega.</span></div></div></div>
   <div className="billing-note">{LOCAL_TEST_MODE?"MODO TESTE: você pode trocar de plano sem cobrança.":"MODO PROFISSIONAL: a assinatura é recorrente pelo Mercado Pago. O status da assinatura é sincronizado com o servidor."}</div></>;
 else if(page==="products")content=<><Head t="Produtos e preços" p="Cadastre produtos para a inteligência identificar valores."/><form className="formgrid" onSubmit={addProduct}><input name="name" placeholder="Produto ou serviço" required/><input name="description" placeholder="Descrição"/><input name="price" type="number" step="0.01" placeholder="Valor" required/><button className="primary" type="submit" disabled={!!entitlements&&entitlements.productsUsed>=entitlements.productLimit}><Plus/>{entitlements&&entitlements.productsUsed>=entitlements.productLimit?"Limite atingido":"Adicionar produto"}</button></form>{notice&&<div className={notice.includes("sucesso")?"notice":"error notice-error"}>{notice}</div>}<div className="card">{products.map(p=><div className="row product" key={p.id}><div><b>{p.name}</b><small>{p.description}</small></div><strong>{money(p.price)}</strong><button className="delete" onClick={async()=>{await fetch(API+"/products/"+p.id,{method:"DELETE",headers:headers()});load()}}><Trash2 size={17}/></button></div>)}</div></>;
 else if(page==="messages")content=<><Head t="Oportunidades agrupadas" p="Veja exatamente onde cada mensagem foi classificada."/><div className="integration-note"><MessageCircle size={20}/><span>{whatsappConnected?"Mensagens recebidas pelo WhatsApp Business são analisadas automaticamente pelo RADAR.":"Conecte o WhatsApp Business na aba ao lado para receber mensagens automaticamente."}</span></div><form className="analyze" onSubmit={analyzeForm}><input name="customer" placeholder="Nome do cliente" required/><textarea name="message" placeholder="Cole uma mensagem..." required/><button className="primary"><Brain size={18}/>Analisar</button></form>{notice&&<div className="notice">{notice}</div>}<Grouped items={msgs} whatsappLink={user.company?.whatsappLink||""} aiReply={entitlements?.aiReply} getReply={fetchAiReply}/></>;
 else if(page==="lab")content=entitlements?.aiReply?<Lab analyze={analyze} products={products}/>:<><Head t="Laboratório da Inteligência" p="Recurso disponível a partir do Radar Pro."/><div className="upgrade-card"><div className="upgrade-icon">🧠</div><h3>Desbloqueie a Inteligência avançada</h3><p>O Laboratório IA e as sugestões de resposta com IA estão disponíveis no Radar Pro e Business.</p><button type="button" className="primary" onClick={()=>{setPage("billing");loadBilling()}}>Ver planos</button></div></>;
 else if(page==="connections")content=(<><Head t="WhatsApp Business" p="Conecte o WhatsApp Business oficial ao RADAR para receber e analisar mensagens automaticamente."/><div className={`wa-status ${whatsappConnected?"connected":"pending"}`}><MessageCircle size={24}/><div><b>{whatsappConnected?"WhatsApp Business conectado":"WhatsApp Business ainda não conectado"}</b><small>{whatsappConfigured?"Cloud API configurada no servidor.":"Token da Cloud API ainda não foi configurado no servidor."}</small></div></div>{whatsappDiag&&whatsappConnected&&<div className="wa-diag"><b>Diagnóstico da integração</b><ul><li>Último evento recebido da Meta: {whatsappDiag.lastEventAt?new Date(whatsappDiag.lastEventAt).toLocaleString("pt-BR"):"nenhum desde o último reinício do servidor"}</li><li>Última mensagem gravada: {whatsappDiag.lastMessageAt?new Date(whatsappDiag.lastMessageAt).toLocaleString("pt-BR"):"nenhuma ainda"}</li>{whatsappDiag.unmatchedCount>0&&!whatsappDiag.lastMessageAt&&<li className="warn">A Meta enviou mensagens, mas nenhuma corresponde ao Phone Number ID cadastrado. Confira se ele é o ID numérico (não o telefone).</li>}</ul></div>}<form className="box whatsapp-connect" onSubmit={saveWhatsappConnection}><h3>Ativar integração</h3><p>Informe os identificadores da conta conectada na Meta. O token da Cloud API fica protegido no servidor e não é digitado aqui.</p><label>Phone Number ID<input value={whatsappPhoneNumberId} onChange={e=>setWhatsappPhoneNumberId(e.target.value.trim())} placeholder="Ex.: 1243057418900394" inputMode="numeric" pattern="[0-9]{8,20}" title="Somente dígitos: o ID numérico da Meta, não o telefone" required/></label><label>WhatsApp Business Account ID<input value={whatsappBusinessAccountId} onChange={e=>setWhatsappBusinessAccountId(e.target.value.trim())} placeholder="Ex.: 1003246327242183"/></label><button className="primary" type="submit">{whatsappConnected?"Atualizar integração":"Ativar WhatsApp Business"}</button></form><div className="whatsapp-settings box"><h3>Sincronização das mensagens</h3><p>Escolha o que o RADAR deverá fazer quando a integração oficial estiver conectada.</p><label className="option-row"><input type="radio" name="whatsapp-history" checked={whatsappHistoryEnabled} onChange={()=>saveWhatsappSettings(true)}/><span><b>Carregar mensagens anteriores</b><small>Importa o histórico somente se a Meta o disponibilizar para o seu número (não é garantido). Mensagens novas são sempre recebidas.</small></span></label><label className="option-row"><input type="radio" name="whatsapp-history" checked={!whatsappHistoryEnabled} onChange={()=>saveWhatsappSettings(false)}/><span><b>Somente mensagens novas</b><small>Começa a analisar somente as mensagens recebidas depois da conexão.</small></span></label></div>{notice&&<div className="notice">{notice}</div>}</>);
 else if(page==="company")content=<><Head t="Minha empresa" p="Cadastre os dados e vínculos."/><form className="company" onSubmit={saveCompany}><label>Nome da empresa<input name="name" defaultValue={user.company?.name||""}/></label><label>Segmento<input name="segment" defaultValue={user.company?.segment||""}/></label><label>Site da empresa<input name="website" defaultValue={user.company?.website||""} placeholder="https://..."/></label><label>Link do WhatsApp<input name="whatsappLink" defaultValue={user.company.whatsappLink||""} placeholder="https://wa.me/..."/></label><button className="primary">Salvar dados</button></form>{notice&&<div className="notice">{notice}</div>}</>;
 else if(page==="about")content=<><Head t="Sobre o RADAR" p="Conheça a história e o estágio atual do projeto."/><div className="about-card"><div className="about-mark">R$</div><h2>RADAR OPORTUNIDADES</h2><p>O RADAR OPORTUNIDADES é um projeto independente desenvolvido por um jovem programador amador, criado com o objetivo de ajudar empresas a identificar oportunidades que podem estar sendo perdidas e evitar perdas financeiras.</p><p>O projeto está em <strong>fase BETA e desenvolvimento</strong>. Muitas funcionalidades ainda estão sendo construídas, testadas e aprimoradas.</p><p><strong>Qualquer ajuda é bem-vinda.</strong> Sugestões, ideias, relatos de problemas e feedbacks ajudam o RADAR a evoluir.</p><p>Obrigado por testar e fazer parte do desenvolvimento do RADAR OPORTUNIDADES.</p></div></>
 else content=<><Head t={user.company?.name||"Bem-vindo"} p="Resumo das mensagens analisadas."/><div className="hero"><span>VALOR TOTAL IDENTIFICADO</span><h1>{money(total)}</h1><p>{msgs.length} mensagens analisadas</p></div><div className="stats"><Stat n={msgs.filter(x=>x.status==="Sem resposta").length} t="Sem resposta"/><Stat n={msgs.filter(x=>x.status==="Orçamento parado").length} t="Orçamentos parados"/><Stat n={msgs.filter(x=>x.status==="Interessado").length} t="Interessados"/></div><Grouped items={msgs.slice(0,10)} whatsappLink={user.company?.whatsappLink||""} aiReply={entitlements?.aiReply} getReply={fetchAiReply}/></>;
 return <div className="shell"><aside className={mobile?"open":""}><div className="brand"><div>R$</div><b>RADAR<small>OPORTUNIDADES</small></b></div>{nav.map(([id,label,Icon]:any)=>{const disabled=accessLocked&&id!=="billing";return <button key={id} disabled={disabled} className={page===id?"active":""} onClick={()=>{if(disabled)return;setPage(id);setMobile(false);setNotice("");if(id==="billing")loadBilling()}}><Icon size={18}/>{label}</button>})}<button className="logout" onClick={()=>{localStorage.removeItem("radar_token");setToken("");setUser(null)}}><LogOut size={18}/>Sair</button></aside><main><header><button className="menu" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><span>{user.name}</span></header><div className="content">{trialMessage&&page!=="billing"&&<div className="trial-banner compact"><div className="trial-icon">⏳</div><div><b>{trialMessage}</b><span>Você está no período gratuito de avaliação, com 200 mensagens analisadas e recursos básicos.</span></div><button type="button" onClick={()=>{setPage("billing");loadBilling()}}>Ver planos</button></div>}{content}</div></main></div>
}
class AppErrorBoundary extends React.Component<{children:React.ReactNode},{error:Error|null}>{
 state={error:null};
 static getDerivedStateFromError(error:Error){return {error};}
 render(){
  if(this.state.error)return <div style={{minHeight:"100vh",background:"#090b10",color:"#f4f6fb",padding:"40px",fontFamily:"Arial"}}><h2>RADAR encontrou um erro ao carregar.</h2><p style={{color:"#ff9ba7"}}>{this.state.error.message}</p><button style={{padding:"10px 14px",borderRadius:"8px",border:0,cursor:"pointer"}} onClick={()=>window.location.reload()}>Recarregar</button></div>;
  return this.props.children;
 }
}
function Lab({analyze,products}:{analyze:(c:string,m:string)=>Promise<any>;products:Product[]}){const[text,setText]=useState("");const[result,setResult]=useState<Msg|null>(null);const[loading,setLoading]=useState(false);async function run(){if(!text.trim())return;setLoading(true);setResult(await analyze("Teste",text));setLoading(false)}return <><Head t="Laboratório da Inteligência" p="Teste uma mensagem e veja exatamente como o sistema interpretou."/><div className="lab"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder='Exemplo: "Olá, quanto custa o serviço?"'/><button type="button" className="primary" onClick={run} disabled={loading}>{loading?"Analisando...":"🧠 Testar inteligência"}</button></div>{result&&<div className="analysis"><h3>Resultado da análise</h3><div className="analysisgrid"><Info t="Categoria" v={result.status}/><Info t="Produto identificado" v={result.product}/><Info t="Valor calculado" v={money(result.value)}/><Info t="Confiança" v={(result.confidence??0)+"%"}/></div><div className="reason"><b>🧠 Por que a inteligência decidiu isso?</b><p>{result.reason||"Resultado baseado nas palavras identificadas na mensagem."}</p></div></div>}<div className="hint">Produtos disponíveis para identificação: {products.length?products.map(p=>p.name).join(", "):"cadastre produtos primeiro."}</div></>}
function Info({t,v}:{t:string;v:string}){return <div><small>{t}</small><b>{v}</b></div>}
function Grouped({items,whatsappLink,aiReply,getReply}:{items:Msg[];whatsappLink?:string;aiReply?:boolean;getReply:(customer:string,message:string)=>Promise<string|null>}){
 const groups=["Sem resposta","Orçamento parado","Interessado","Revisar","Não é oportunidade"];
 return <div className="groups">{groups.map(g=><Group key={g} title={g} items={items.filter(x=>x.status===g)} whatsappLink={whatsappLink} aiReply={aiReply} getReply={getReply}/>)}</div>
}
function Group({title,items,whatsappLink,aiReply,getReply}:{title:string;items:Msg[];whatsappLink?:string;aiReply?:boolean;getReply:(customer:string,message:string)=>Promise<string|null>}){
 const[open,setOpen]=useState(true);
 const icon=title==="Sem resposta"?"🔴":title==="Orçamento parado"?"🟡":title==="Interessado"?"🟢":title==="Revisar"?"🔵":"⚪";
 return <section className="group"><button className="grouphead" onClick={()=>setOpen(!open)}><span>{icon} {title} <small>({items.length})</small></span>{open?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button>{open&&<div className="card">{items.length===0?<div className="empty">Nenhuma mensagem neste grupo.</div>:items.map(m=><MessageCard key={m.id} m={m} whatsappLink={whatsappLink} aiReply={aiReply} getReply={getReply}/>)}</div>}</section>
}
function MessageCard({m,whatsappLink,aiReply,getReply}:{m:Msg;whatsappLink?:string;aiReply?:boolean;getReply:(customer:string,message:string)=>Promise<string|null>}){
 const[details,setDetails]=useState(false);
 const[showReply,setShowReply]=useState(false);
 const[loadingReply,setLoadingReply]=useState(false);
 const fallback=`Olá, ${m.customer}! Tudo bem? 😊 Vimos sua mensagem e queremos ajudar. Como podemos continuar o atendimento?`;
 const[reply,setReply]=useState(fallback);
 const canReply=m.status==="Sem resposta" && !!whatsappLink;
 async function toggleReply(){
  const next=!showReply;
  setShowReply(next);
  if(next && aiReply){
   setLoadingReply(true);
   const suggestion=await getReply(m.customer,m.message);
   setReply(suggestion||fallback);
   setLoadingReply(false);
  }
 }
 return <div className="row msg">
  <div className="avatar">{m.customer.slice(0,2).toUpperCase()}</div>
  <div className="message">
   <b>{m.customer}</b><small>{m.message}</small>
   <div className="actions">
    <button type="button" className="details" onClick={()=>setDetails(!details)}>{details?"Ocultar análise":"Ver análise da IA"}</button>
    {m.status==="Sem resposta"&&<button type="button" className="reply" onClick={toggleReply}>💬 Responder cliente</button>}
   </div>
   {details&&<div className="mini-analysis"><b>Produto:</b> {m.product} · <b>Valor:</b> {money(m.value)}<br/><b>Confiança:</b> {m.confidence??"—"}%<br/><b>Motivo:</b> {m.reason||"Classificação baseada no contexto disponível."}</div>}
   {showReply&&<div className="replybox"><b>{aiReply?"Resposta sugerida pela IA":"Resposta sugerida"}</b><textarea value={loadingReply?"Gerando sugestão...":reply} onChange={e=>setReply(e.target.value)} disabled={loadingReply}/>{canReply?<a className="primary whatsapp" href={whatsappLink} target="_blank" rel="noreferrer">Abrir WhatsApp vinculado</a>:<small>Cadastre o link do WhatsApp em “Minha empresa” para abrir o canal.</small>}</div>}
  </div>
  <div className="value"><small>{m.product}</small><strong>{money(m.value)}</strong></div>
 </div>
}function Head({t,p}:{t:string;p:string}){return <div className="head"><h2>{t}</h2><p>{p}</p></div>}
function Stat({n,t}:{n:number;t:string}){return <div className="stat"><small>{t}</small><b>{n}</b></div>}
createRoot(document.getElementById("root")!).render(<AppErrorBoundary><App/></AppErrorBoundary>);
