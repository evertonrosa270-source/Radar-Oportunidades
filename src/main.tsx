import React,{useEffect,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import{LayoutDashboard,MessageSquare,Package,Building2,LogOut,Plus,Trash2,Link2,Menu,X,Upload,MessageCircle,FlaskConical,ChevronDown,ChevronUp,Brain,CreditCard}from"lucide-react";
import"./styles.css";
const API=(import.meta.env.VITE_API_URL||"/api").replace(/\/$/,"");
const GOOGLE_CLIENT_ID=String(import.meta.env.VITE_GOOGLE_CLIENT_ID||"").trim();
const LOCAL_TEST_MODE=String(import.meta.env.VITE_LOCAL_TEST||"").toLowerCase()==="true" || window.location.hostname==="localhost" || window.location.hostname==="127.0.0.1";
const money=(n:number)=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
type User={name:string,email:string;access?:any;company:{name:string;segment:string;website:string;whatsappLink:string}};
type Product={id:number|string;name:string;description:string;price:number};
type Msg={id:number;customer:string;message:string;product:string;value:number;status:string;reason?:string;confidence?:number;createdAt:string};
declare global { interface Window { google?: any } }

function App(){
 const[token,setToken]=useState(localStorage.getItem("radar_token")||"");const[user,setUser]=useState<User|null>(null);
 const[page,setPage]=useState("dashboard");const[mobile,setMobile]=useState(false);const[mode,setMode]=useState<"login"|"register">("login");
 const[error,setError]=useState("");const googleButtonRef=useRef<HTMLDivElement|null>(null);const[whatsappHistoryEnabled,setWhatsappHistoryEnabled]=useState(true);const[plans,setPlans]=useState<any[]>([]);const[subscription,setSubscription]=useState<any|null>(null);const[entitlements,setEntitlements]=useState<any|null>(null);const[billingLoading,setBillingLoading]=useState(false);const[products,setProducts]=useState<Product[]>([]);const[msgs,setMsgs]=useState<Msg[]>([]);const[notice,setNotice]=useState("");
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
   fetch(API+"/subscription/sync",{method:"POST",headers:headers()}).then(()=>loadBilling()).catch(()=>{});
   window.history.replaceState({},document.title,window.location.pathname);
  }
 },[user,token]);
 useEffect(()=>{if(user && user.access && !user.access.canUse)setPage("billing")},[user]);
 async function login(e:any){e.preventDefault();setError("");const f=new FormData(e.currentTarget),body=mode==="login"?{email:f.get("email"),password:f.get("password")}:{name:f.get("name"),email:f.get("email"),password:f.get("password")};try{const r=await fetch(API+"/"+(mode==="login"?"login":"register"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok){setError(j.error||"Não foi possível entrar.");return}if(!j.token){setError("O servidor não retornou uma sessão válida.");return}localStorage.setItem("radar_token",j.token);setToken(j.token)}catch{setError("Não foi possível conectar ao servidor. Verifique a API e a conexão.")}}
 async function loginGoogle(credential:string){setError("");try{const r=await fetch(API+"/auth/google",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({credential})});const j=await r.json().catch(()=>({}));if(!r.ok){setError(j.error||"Não foi possível entrar com Google.");return}if(!j.token){setError("O servidor não retornou uma sessão válida.");return}localStorage.setItem("radar_token",j.token);setToken(j.token)}catch{setError("Não foi possível conectar ao servidor.")}}
 useEffect(()=>{if(token||!GOOGLE_CLIENT_ID)return;let script=document.querySelector('script[data-radar-google="1"]') as HTMLScriptElement|null;const render=()=>{if(!window.google||!googleButtonRef.current)return;googleButtonRef.current.innerHTML="";window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:(response:any)=>{if(response?.credential)loginGoogle(response.credential)},auto_select:false});window.google.accounts.id.renderButton(googleButtonRef.current,{theme:"outline",size:"large",shape:"rectangular",text:"continue_with",logo_alignment:"left",width:340});};if(script){if(window.google)render();else script.addEventListener("load",render,{once:true})}else{script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;script.defer=true;script.dataset.radarGoogle="1";script.onload=render;document.head.appendChild(script)}return()=>{try{window.google?.accounts?.id?.cancel()}catch{}}},[token,mode]);
 if(!token)return <div className="auth"><form onSubmit={login} className="authcard"><div className="mark">R$</div><h1>RADAR</h1><p>{mode==="login"?"Entre na sua conta.":"Crie sua conta gratuitamente."}</p>{GOOGLE_CLIENT_ID&&<><div ref={googleButtonRef} className="google-button"></div><div className="auth-divider"><span>ou</span></div></>}{mode==="register"&&<input name="name" placeholder="Seu nome" required/>}<input name="email" placeholder="E-mail" type="email" required/><input name="password" placeholder="Senha (mínimo 8)" type="password" required/><button className="primary">{mode==="login"?"Entrar":"Criar conta"}</button>{error&&<div className="error">{error}</div>}<button type="button" className="link" onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}>{mode==="login"?"Criar minha conta":"Já tenho uma conta"}</button></form></div>;
 if(!user)return <div className="loading">Carregando...</div>;
 const total=msgs.reduce((s,m)=>s+m.value,0);
 const accessLocked=!!(user.access && !user.access.canUse);
 const nav=[["dashboard","Visão geral",LayoutDashboard],["messages","Oportunidades",MessageSquare],["lab","Laboratório IA",FlaskConical],["products","Produtos e preços",Package],["connections","Vinculações",Link2],["company","Minha empresa",Building2],["billing","Assinatura",CreditCard]];
 async function loadBilling(){
  setBillingLoading(true);setNotice("");
  try{
   const [pr,sr,er]=await Promise.all([fetch(API+"/plans",{headers:headers()}),fetch(API+"/subscription",{headers:headers()}),fetch(API+"/entitlements",{headers:headers()})]);
   const pj=await pr.json().catch(()=>({}));
   const sj=await sr.json().catch(()=>null);
   if(!pr.ok){setNotice(pj.error||"Não foi possível carregar os planos.");setPlans([])}else{setPlans(Array.isArray(pj)?pj:[])}
   if(sr.ok)setSubscription(sj);else setSubscription(null);
   if(er.ok){const ej=await er.json().catch(()=>null);if(ej)setEntitlements(ej);}
  }catch{setNotice("Não foi possível conectar ao servidor. Verifique se o backend está rodando.");}
  finally{setBillingLoading(false);}
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
 async function saveCompany(e:any){e.preventDefault();setNotice("");const f=new FormData(e.currentTarget);const r=await fetch(API+"/company",{method:"PUT",headers:headers(),body:JSON.stringify({name:f.get("name"),segment:f.get("segment"),website:f.get("website"),whatsappLink:f.get("whatsappLink")})});if(r.ok){setNotice("Dados salvos com sucesso.");load()}}
 async function importFile(file:File){setNotice("");const text=await file.text(),lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),messages:any[]=[];for(const line of lines){const sep=line.includes(";")?";":",",parts=line.split(sep);if(parts.length>=2)messages.push({customer:parts.shift()?.trim()||"Cliente",message:parts.join(sep).trim()});else messages.push({customer:"Cliente importado",message:line})}const r=await fetch(API+"/import-messages",{method:"POST",headers:headers(),body:JSON.stringify({messages})}),j=await r.json();if(r.ok){setNotice(`${j.imported} mensagens importadas e analisadas.`);load()}else setNotice(j.error||"Erro ao importar.")}

 const trialEnds=entitlements?.trialEndsAt?new Date(entitlements.trialEndsAt):null;
 const trialRemaining=trialEnds?Math.max(0,trialEnds.getTime()-Date.now()):0;
 const trialHours=Math.ceil(trialRemaining/3600000);
 const trialMessage=entitlements?.trialActive?`Você está usando o Free Trial — 1 dia grátis. ${trialHours<=24?`Restam aproximadamente ${trialHours} hora${trialHours===1?"":"s"}.`:""}`:"";
 let content:any;
 if(page==="billing")content=<><Head t={accessLocked?"Escolha seu plano para continuar":"Assinatura"} p={accessLocked?"Seu período gratuito terminou. Escolha um plano para continuar usando o RADAR.":"Gerencie seu plano, veja seus limites e mude de plano quando quiser."}/>{LOCAL_TEST_MODE&&<div className="test-mode-badge">🧪 MODO TESTE — nenhuma cobrança real</div>}{trialMessage&&<div className="trial-banner"><div className="trial-icon">⏳</div><div><b>{trialMessage}</b><span>Durante o teste, você experimenta os recursos do Radar Pro.</span></div></div>}{subscription&&<div className="subscription-status"><b>Plano atual</b><span>{subscription.name||"Radar Pro"} · {subscription.status}</span>{subscription.status!=="cancelled"&&<button type="button" onClick={cancelSubscription}>Cancelar assinatura</button>}</div>}{entitlements&&<div className="usage-card"><div><b>Seu uso neste mês</b><span>{entitlements.messagesUsed?.toLocaleString("pt-BR")} / {entitlements.messageLimit?.toLocaleString("pt-BR")} mensagens analisadas</span></div><div><b>Produtos/serviços</b><span>{entitlements.productsUsed?.toLocaleString("pt-BR")} / {entitlements.productLimit?.toLocaleString("pt-BR")}</span></div></div>}{billingLoading?<div className="card empty">Carregando planos...</div>:<div className="plans">{plans.length?plans.map((p:any)=>{const active=subscription&&subscription.status!=="cancelled"&&subscription.code===p.code;const f=p.features||{};return <div className={`plan ${active?"plan-current":""}`} key={p.id}>{active&&<span className="current-badge">SEU PLANO</span>}<span className="plan-badge">{p.code==="RADAR_BUSINESS"?"EMPRESAS":p.code==="RADAR_PRO"?"MAIS ESCOLHIDO":"INICIAL"}</span><h3>{p.name}</h3><div className="plan-price">{money(p.price)}<small>/mês</small></div><p>{p.code==="RADAR_START"?"Para começar a organizar e identificar oportunidades.":p.code==="RADAR_PRO"?"Inteligência comercial completa para transformar mensagens em vendas.":"Para equipes e operações com alto volume de oportunidades."}</p><ul className="plan-features"><li>✓ {f.messageLimit?.toLocaleString("pt-BR")} mensagens analisadas/mês</li><li>✓ Até {f.productLimit?.toLocaleString("pt-BR")} produtos/serviços</li><li>✓ IA {f.aiLevel}</li><li>✓ Histórico de {f.historyDays} dias</li><li>✓ Importação de até {p.code==="RADAR_START"?100:p.code==="RADAR_PRO"?500:1000} mensagens por vez</li><li>{f.aiReply?"✓":"✕"} Sugestões de resposta com IA</li></ul><button type="button" className={active?"secondary":"primary"} onClick={()=>subscribe(p.code)} disabled={active}>{active?"Plano atual":subscription&&subscription.status!=="cancelled"?`Mudar para ${p.name}`:"Assinar agora"}</button></div>}) : <div className="card empty">Nenhum plano disponível.</div>}</div>}{notice&&<div className="notice notice-error">{notice}</div>}<div className="billing-note">{LOCAL_TEST_MODE?"MODO TESTE: você pode trocar de plano sem cobrança. Use para testar limites, bloqueios e cancelamento.":"MODO PROFISSIONAL: a assinatura é recorrente pelo Mercado Pago. Você pode trocar de plano a qualquer momento."}</div></>;
 else if(page==="products")content=<><Head t="Produtos e preços" p="Cadastre produtos para a inteligência identificar valores."/><form className="formgrid" onSubmit={addProduct}><input name="name" placeholder="Produto ou serviço" required/><input name="description" placeholder="Descrição"/><input name="price" type="number" step="0.01" placeholder="Valor" required/><button className="primary" type="submit" disabled={!!entitlements&&entitlements.productsUsed>=entitlements.productLimit}><Plus/>{entitlements&&entitlements.productsUsed>=entitlements.productLimit?"Limite atingido":"Adicionar produto"}</button></form>{notice&&<div className={notice.includes("sucesso")?"notice":"error notice-error"}>{notice}</div>}<div className="card">{products.map(p=><div className="row product" key={p.id}><div><b>{p.name}</b><small>{p.description}</small></div><strong>{money(p.price)}</strong><button className="delete" onClick={async()=>{await fetch(API+"/products/"+p.id,{method:"DELETE",headers:headers()});load()}}><Trash2 size={17}/></button></div>)}</div></>;
 else if(page==="messages")content=<><Head t="Oportunidades agrupadas" p="Veja exatamente onde cada mensagem foi classificada."/><div className="import-box"><Upload size={22}/><div><b>Importar conversas</b><small>TXT ou CSV: Cliente;Mensagem</small></div><label className="filebtn">Escolher arquivo<input type="file" accept=".txt,.csv" onChange={e=>e.target.files?.[0]&&importFile(e.target.files[0])}/></label></div><form className="analyze" onSubmit={analyzeForm}><input name="customer" placeholder="Nome do cliente" required/><textarea name="message" placeholder="Cole uma mensagem..." required/><button className="primary"><Brain size={18}/>Analisar</button></form>{notice&&<div className="notice">{notice}</div>}<Grouped items={msgs} whatsappLink={user.company?.whatsappLink||""} aiReply={entitlements?.aiReply} getReply={fetchAiReply}/></>;
 else if(page==="lab")content=entitlements?.aiReply?<Lab analyze={analyze} products={products}/>:<><Head t="Laboratório da Inteligência" p="Recurso disponível a partir do Radar Pro."/><div className="upgrade-card"><div className="upgrade-icon">🧠</div><h3>Desbloqueie a Inteligência avançada</h3><p>O Laboratório IA e as sugestões de resposta com IA estão disponíveis no Radar Pro e Business.</p><button type="button" className="primary" onClick={()=>{setPage("billing");loadBilling()}}>Ver planos</button></div></>;
 else if(page==="connections")content=(<><Head t="Vinculações" p="Configure como o RADAR deverá tratar o WhatsApp da empresa."/><div className="connections"><div className="box"><MessageCircle size={28}/><h3>WhatsApp da empresa</h3><p>O link público wa.me continua disponível para contato. A leitura automática depende da integração oficial do WhatsApp Business.</p><button type="button" onClick={()=>setPage("company")}>Cadastrar/alterar link</button></div><div className="box"><Upload size={28}/><h3>Importar conversas</h3><p>TXT ou CSV para análise enquanto a integração oficial não estiver conectada.</p><button type="button" onClick={()=>setPage("messages")}>Importar agora</button></div></div><div className="whatsapp-settings box"><h3>Sincronização das mensagens</h3><p>Escolha o que o RADAR deverá fazer quando a integração oficial estiver conectada.</p><label className="option-row"><input type="radio" name="whatsapp-history" checked={whatsappHistoryEnabled} onChange={()=>saveWhatsappSettings(true)}/><span><b>Carregar mensagens anteriores</b><small>Importa o histórico disponibilizado pela integração e depois continua recebendo mensagens novas.</small></span></label><label className="option-row"><input type="radio" name="whatsapp-history" checked={!whatsappHistoryEnabled} onChange={()=>saveWhatsappSettings(false)}/><span><b>Somente mensagens novas</b><small>Começa a analisar somente as mensagens recebidas depois da conexão.</small></span></label></div></>);
 else if(page==="company")content=<><Head t="Minha empresa" p="Cadastre os dados e vínculos."/><form className="company" onSubmit={saveCompany}><label>Nome da empresa<input name="name" defaultValue={user.company?.name||""}/></label><label>Segmento<input name="segment" defaultValue={user.company?.segment||""}/></label><label>Site da empresa<input name="website" defaultValue={user.company?.website||""} placeholder="https://..."/></label><label>Link do WhatsApp<input name="whatsappLink" defaultValue={user.company.whatsappLink||""} placeholder="https://wa.me/..."/></label><button className="primary">Salvar dados</button></form>{notice&&<div className="notice">{notice}</div>}</>;
 else content=<><Head t={user.company?.name||"Bem-vindo"} p="Resumo das mensagens analisadas."/><div className="hero"><span>VALOR TOTAL IDENTIFICADO</span><h1>{money(total)}</h1><p>{msgs.length} mensagens analisadas</p></div><div className="stats"><Stat n={msgs.filter(x=>x.status==="Sem resposta").length} t="Sem resposta"/><Stat n={msgs.filter(x=>x.status==="Orçamento parado").length} t="Orçamentos parados"/><Stat n={msgs.filter(x=>x.status==="Interessado").length} t="Interessados"/></div><Grouped items={msgs.slice(0,10)} whatsappLink={user.company?.whatsappLink||""} aiReply={entitlements?.aiReply} getReply={fetchAiReply}/></>;
 return <div className="shell"><aside className={mobile?"open":""}><div className="brand"><div>R$</div><b>RADAR<small>OPORTUNIDADES</small></b></div>{nav.map(([id,label,Icon]:any)=>{const disabled=accessLocked&&id!=="billing";return <button key={id} disabled={disabled} className={page===id?"active":""} onClick={()=>{if(disabled)return;setPage(id);setMobile(false);setNotice("");if(id==="billing")loadBilling()}}><Icon size={18}/>{label}</button>})}<button className="logout" onClick={()=>{localStorage.removeItem("radar_token");setToken("");setUser(null)}}><LogOut size={18}/>Sair</button></aside><main><header><button className="menu" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button><span>{user.name}</span></header><div className="content">{trialMessage&&page!=="billing"&&<div className="trial-banner compact"><div className="trial-icon">⏳</div><div><b>{trialMessage}</b><span>Você está experimentando os recursos do Radar Pro.</span></div><button type="button" onClick={()=>{setPage("billing");loadBilling()}}>Ver planos</button></div>}{content}</div></main></div>
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
