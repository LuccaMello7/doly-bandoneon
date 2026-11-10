/* ================== Conta (opcional, Supabase) ==================
   Sem conta, o app funciona inteiro no aparelho, como sempre. Com conta, uma cópia do que o app guarda
   (progresso, melodias criadas, ajustes) fica na nuvem e volta em outro aparelho.
   - A biblioteca do Supabase (js/vendor/supabase.js, 2.118.0) só é baixada por quem usa a conta.
   - A chave abaixo é a "publicável": vai no site de propósito e sozinha não abre nada. Quem protege os
     dados são as regras de acesso do banco (supabase/banco.sql): cada pessoa só lê e grava a própria linha.
     A chave secreta NUNCA entra no site nem no repositório.
   - Contas só para maiores de 18 anos (decisão do dono, LGPD): a caixa de aceite libera os botões. */
const SUPA_URL = 'https://venbupxwqgofwjkhixhc.supabase.co';
const SUPA_CHAVE = 'sb_publishable_Dn-1zGaZDa6S7ie58bsD1Q_FLfhayDd';
const SUPA_SESSAO = 'sb-venbupxwqgofwjkhixhc-auth-token'; // onde a biblioteca guarda o login neste navegador
const TERMOS_VERSAO = '2026-11-10';
// Enquanto o envio de e-mail e o Google não estão configurados, a aba fica fora do menu (abre por #conta, para testar)
const CONTA_LIGADA = true;
// O que é deste aparelho e não viaja para a conta: MIDI, microfone, teclado do computador, avisos já vistos, aba
const NAO_SINCRONIZA = new Set(['ultimaAba', 'pcLigado', 'pcDica', 'midiBotoes', 'midiCC', 'midiForca', 'micLimiar',
  'avisoProfVisto', 'instalarNao', 'aberturas', 'lang', 'contaAceite']);

let sb = null, contaUsuario = null, contaSincronizando = false, contaUltima = null, contaErro = '', contaEnvioTimer = 0;

function carregarSupabase(){
  if(sb) return Promise.resolve(sb);
  return new Promise((ok, falha)=>{
    const s = document.createElement('script'); s.src = RAIZ + 'js/vendor/supabase.js';
    s.onload = ()=>{
      sb = supabase.createClient(SUPA_URL, SUPA_CHAVE, {auth:{flowType:'pkce', persistSession:true, autoRefreshToken:true, detectSessionInUrl:true}});
      sb.auth.onAuthStateChange((ev, sessao)=>{ contaUsuario = sessao ? sessao.user : null; renderConta(); });
      ok(sb);
    };
    s.onerror = ()=>falha(new Error('rede'));
    document.head.appendChild(s);
  });
}

/* ---------- Juntar o aparelho com a nuvem ---------- */
const ehObjeto = v => v && typeof v === 'object' && !Array.isArray(v);
// Progresso: o que foi conquistado em qualquer aparelho fica. Números ficam com o maior (recordes, contagens),
// verdadeiro ganha de falso, listas se somam, objetos se juntam chave a chave; textos (datas) ficam com os deste aparelho.
function juntarProgresso(a, b){
  if(a === undefined || a === null) return b === undefined ? a : b;
  if(b === undefined || b === null) return a;
  if(typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if(typeof a === 'boolean' && typeof b === 'boolean') return a || b;
  if(Array.isArray(a) && Array.isArray(b)){
    const vistos = new Set(a.map(x=>JSON.stringify(x)));
    return a.concat(b.filter(x=>!vistos.has(JSON.stringify(x))));
  }
  if(ehObjeto(a) && ehObjeto(b)){
    const r = {};
    for(const k of new Set([...Object.keys(a), ...Object.keys(b)])) r[k] = juntarProgresso(a[k], b[k]);
    return r;
  }
  return a;
}
// As outras chaves: o que só existe de um lado entra; nas listas (melodias criadas) e nos objetos (digitações) as
// entradas se somam e, se a mesma existe nos dois, fica a deste aparelho; nos ajustes simples, vale o deste aparelho.
function juntarChave(k, local, nuvem){
  if(local === undefined) return nuvem;
  if(nuvem === undefined) return local;
  if(k === 'progress') return juntarProgresso(local, nuvem);
  if(Array.isArray(local) && Array.isArray(nuvem)){ // melodias e partituras criadas: entra a que só existe do outro lado
    const id = x => x && x.id != null ? 'id:' + x.id : JSON.stringify(x), aqui = new Set(local.map(id));
    return local.concat(nuvem.filter(x=>!aqui.has(id(x))));
  }
  if(ehObjeto(local) && ehObjeto(nuvem)) return Object.assign({}, nuvem, local);
  return local;
}
function dadosLocais(){
  const d = {};
  Object.keys(localStorage).filter(k=>k.startsWith(PREFIX)).forEach(k=>{
    const nome = k.slice(PREFIX.length); if(NAO_SINCRONIZA.has(nome)) return;
    try{ d[nome] = JSON.parse(localStorage.getItem(k)); }catch(e){}
  });
  return d;
}
function juntarTudo(local, nuvem){
  const junto = {};
  for(const k of new Set([...Object.keys(local), ...Object.keys(nuvem || {})])) if(!NAO_SINCRONIZA.has(k)){
    const v = juntarChave(k, local[k], (nuvem || {})[k]); if(v !== undefined) junto[k] = v;
  }
  return junto;
}

/* ---------- Sincronizar ---------- */
// Sempre junta antes de gravar: assim nada que veio de outro aparelho se perde, mesmo que este grave por cima depois.
async function sincronizarConta(motivo){
  if(!sb || !contaUsuario || contaSincronizando) return;
  contaSincronizando = true; contaErro = ''; renderConta();
  try{
    const {data, error} = await sb.from('progresso').select('dados').eq('user_id', contaUsuario.id).maybeSingle();
    if(error) throw error;
    const local = dadosLocais(), junto = juntarTudo(local, data ? data.dados : {});
    let mudou = false;
    for(const k of Object.keys(junto)) if(JSON.stringify(junto[k]) !== JSON.stringify(local[k])){
      mudou = true; try{ localStorage.setItem(PREFIX + k, JSON.stringify(junto[k])); }catch(e){}
    }
    const linha = {user_id: contaUsuario.id, dados: junto, atualizado: new Date().toISOString()};
    const aceite = store.get('contaAceite', null);
    if(!data && aceite) Object.assign(linha, {aceite_versao: aceite.versao, declarou_maior: !!aceite.maior, aceito_em: aceite.em});
    const r = await sb.from('progresso').upsert(linha);
    if(r.error) throw r.error;
    contaUltima = new Date();
    // o que chegou da nuvem só aparece na tela recarregando (as abas leem os dados ao abrir); uma vez por visita
    if(mudou && (motivo === 'inicio' || motivo === 'entrar') && !sessionStorage.getItem('bandoly-conta-recarregou')){
      sessionStorage.setItem('bandoly-conta-recarregou', '1');
      if(motivo === 'entrar') location.hash = 'conta';
      location.reload(); return;
    }
  }catch(e){
    contaErro = t('Não deu para sincronizar agora. O progresso continua salvo neste aparelho e vai para a nuvem na próxima vez.');
  }finally{ contaSincronizando = false; renderConta(); }
}
function agendarEnvio(){ clearTimeout(contaEnvioTimer); contaEnvioTimer = setTimeout(()=>sincronizarConta('mudanca'), 8000); }
// toda gravação do app avisa a conta (sem pesar: junta as mudanças de 8 segundos numa só ida à nuvem)
{ const gravar = store.set;
  store.set = (k, v)=>{ gravar(k, v); if(contaUsuario && !NAO_SINCRONIZA.has(k)) agendarEnvio(); }; }
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState === 'hidden' && contaEnvioTimer && contaUsuario){ clearTimeout(contaEnvioTimer); contaEnvioTimer = 0; sincronizarConta('saindo'); } });

/* ---------- Entrar, sair, baixar e excluir ---------- */
const contaRetorno = () => location.origin + location.pathname; // sem o #: o login volta com ?code= e o app abre a aba Conta
function contaAceitou(){ return $('#contaAceite').checked; }
function guardarAceite(){ store.set('contaAceite', {versao: TERMOS_VERSAO, maior: true, em: new Date().toISOString()}); }
function contaMsg(txt, cls){ const m = $('#contaMsg'); m.className = 'feedback' + (cls ? ' ' + cls : ''); m.textContent = txt; }
function contaSemSite(){ if(location.protocol.startsWith('http')) return false; contaMsg(t('A conta só funciona no site (bandoly.app), não com o arquivo aberto do computador.'), 'bad'); return true; }

$('#contaAceite').onchange = ()=>{ $('#contaGoogle').disabled = $('#contaEnviar').disabled = !contaAceitou(); };
$('#contaGoogle').onclick = async ()=>{
  if(!contaAceitou() || contaSemSite()) return;
  guardarAceite();
  try{ await carregarSupabase(); const r = await sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: contaRetorno()}}); if(r.error) throw r.error; }
  catch(e){ contaMsg(t('Não deu para abrir o login do Google. Confira a internet e tente de novo.'), 'bad'); }
};
$('#contaEmailForm').onsubmit = async e=>{
  e.preventDefault();
  if(!contaAceitou() || contaSemSite()) return;
  const email = $('#contaEmail').value.trim(); if(!email) return;
  guardarAceite(); $('#contaEnviar').disabled = true; contaMsg(t('Enviando…'));
  try{
    await carregarSupabase();
    const r = await sb.auth.signInWithOtp({email, options:{emailRedirectTo: contaRetorno(), shouldCreateUser: true, data:{aceite_versao: TERMOS_VERSAO, declarou_maior: true}}});
    if(r.error) throw r.error;
    contaMsg(t('Pronto! Enviamos um link para {}. Abra o e-mail neste mesmo navegador para entrar.', email), 'ok');
  }catch(err){
    contaMsg(t('Não deu para enviar o link agora. Confira o e-mail digitado e tente de novo em alguns minutos.'), 'bad');
  }finally{ $('#contaEnviar').disabled = !contaAceitou(); }
};
$('#contaSincronizar').onclick = ()=>sincronizarConta('botao');
$('#contaSair').onclick = async ()=>{
  if(!sb) return;
  await sincronizarConta('saindo');
  await sb.auth.signOut(); contaUsuario = null; renderConta();
  avisar(`<span>${t('Você saiu da conta. O progresso continua neste aparelho.')}</span>`);
};
$('#contaBaixar').onclick = async ()=>{
  if(!sb || !contaUsuario) return;
  const {data, error} = await sb.from('progresso').select('*').eq('user_id', contaUsuario.id).maybeSingle();
  if(error){ contaMsg(t('Não deu para baixar agora. Confira a internet e tente de novo.'), 'bad'); return; }
  const u = contaUsuario, copia = {app:'BanDoly', exportado: new Date().toISOString(),
    conta:{id: u.id, email: u.email, criada: u.created_at, entrou_com: (u.app_metadata && u.app_metadata.provider) || ''},
    guardado_na_nuvem: data || null};
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 1)], {type:'application/json'}));
  a.download = `meus-dados-bandoly-${new Date().toISOString().slice(0,10)}.json`; a.click();
};
$('#contaExcluir').onclick = async ()=>{
  if(!sb || !contaUsuario) return;
  if(!confirm(t('Excluir a sua conta? O login e tudo o que está guardado na nuvem serão apagados agora, sem volta. O progresso deste aparelho continua aqui.'))) return;
  const r = await sb.rpc('excluir_minha_conta');
  if(r.error){ contaMsg(t('Não deu para excluir agora. Tente de novo; se continuar, escreva para contato@bandoly.app.'), 'bad'); return; }
  await sb.auth.signOut({scope:'local'}); contaUsuario = null; localStorage.removeItem(PREFIX + 'contaAceite');
  renderConta(); contaMsg(t('Conta excluída. Os dados da nuvem foram apagados.'), 'ok');
};

/* ---------- Tela ---------- */
function renderConta(){
  const dentro = !!contaUsuario;
  $('#contaFora').hidden = dentro; $('#contaDentro').hidden = !dentro; $('#contaDados').hidden = !dentro;
  if(!dentro) return;
  $('#contaQuem').textContent = contaUsuario.email || '';
  $('#contaEstado').textContent = contaSincronizando ? t('Sincronizando…')
    : contaErro ? contaErro
    : contaUltima ? t('Progresso guardado na nuvem às {}.', contaUltima.toLocaleTimeString(IDIOMAS[state.lang].html, {hour:'2-digit', minute:'2-digit'}))
    : t('O progresso deste aparelho vai para a nuvem automaticamente.');
  $('#contaSincronizar').disabled = contaSincronizando;
}
$('#contaAba').classList.toggle('desligada', !CONTA_LIGADA); // o menu mostra todas as abas da área: a classe vence

// Ao abrir: volta do login (?code=… ou ?error=…) ou já havia login neste navegador → carrega a biblioteca e sincroniza
async function iniciarConta(){
  const q = new URLSearchParams(location.search), voltou = q.has('code') || q.has('error_description');
  if(!voltou && !localStorage.getItem(SUPA_SESSAO)) return;
  try{ await carregarSupabase(); }catch(e){ return; } // sem internet: fica tudo no aparelho
  const {data} = await sb.auth.getSession(); // espera a troca do ?code= pelo login
  contaUsuario = data && data.session ? data.session.user : null;
  if(voltou){
    history.replaceState(null, '', location.pathname + location.hash);
    go('conta');
    if(q.has('error_description')) contaMsg(t('O link de acesso expirou ou já foi usado. Peça um novo.'), 'bad');
  }
  renderConta();
  if(contaUsuario) sincronizarConta(voltou ? 'entrar' : 'inicio');
}
iniciarConta();
