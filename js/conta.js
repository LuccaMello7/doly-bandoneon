/* ================== Conta (opcional, Supabase) ==================
   Sem conta, o app funciona inteiro no aparelho, como sempre. Com conta, uma cópia do que o app guarda
   (progresso, melodias criadas, ajustes) fica na nuvem e volta em outro aparelho.
   - A biblioteca do Supabase (js/vendor/supabase.js, 2.118.0) só é baixada por quem usa a conta.
   - A chave abaixo é a "publicável": vai no site de propósito e sozinha não abre nada. Quem protege os
     dados são as regras de acesso do banco (supabase/banco.sql): cada pessoa só lê e grava a própria linha.
     A chave secreta NUNCA entra no site nem no repositório.
   - Contas só para maiores de 18 anos (decisão do dono, LGPD): sem marcar a caixa de aceite, entrar não segue.
   - A tela: "Entrar" (ou o círculo com a inicial, que abre um menu) fica no topo; a aba Conta é um cartão em
     dois passos (escolher como entrar → "Confira o seu e-mail") e, conectado, o painel da nuvem e dos dados. */
// Domínio próprio do login (complemento pago do Supabase): com ele, a tela do Google diz "bandoly.app".
// Quando auth.bandoly.app estiver ativo, troque '' por 'https://auth.bandoly.app'. O login das pessoas continua
// valendo, porque o lugar onde ele fica guardado no navegador (SUPA_SESSAO) não muda.
const SUPA_DOMINIO = '';
const SUPA_URL = SUPA_DOMINIO || 'https://venbupxwqgofwjkhixhc.supabase.co';
const SUPA_CHAVE = 'sb_publishable_Dn-1zGaZDa6S7ie58bsD1Q_FLfhayDd';
const SUPA_SESSAO = 'sb-venbupxwqgofwjkhixhc-auth-token'; // onde a biblioteca guarda o login neste navegador
const TERMOS_VERSAO = '2026-11-10';
// O que é deste aparelho e não viaja para a conta: MIDI, microfone, teclado do computador, avisos já vistos, aba
const NAO_SINCRONIZA = new Set(['ultimaAba', 'pcLigado', 'pcDica', 'midiBotoes', 'midiCC', 'midiForca', 'micLimiar',
  'avisoProfVisto', 'instalarNao', 'aberturas', 'lang', 'contaAceite',
  'relatorios', 'turmaConvite']); // relatórios recebidos de alunos e o convite de turma pendente também ficam só no aparelho

let sb = null, contaUsuario = null, contaSincronizando = false, contaUltima = null, contaErro = '', contaEnvioTimer = 0;
let contaVoltaPara = 'inicio', contaEnviadoEmail = '', contaReenvioAte = 0, contaReenvioTimer = 0;

function carregarSupabase(){
  if(sb) return Promise.resolve(sb);
  return new Promise((ok, falha)=>{
    const s = document.createElement('script'); s.src = RAIZ + 'js/vendor/supabase.js';
    s.onload = ()=>{
      sb = supabase.createClient(SUPA_URL, SUPA_CHAVE, {auth:{flowType:'pkce', persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, storageKey: SUPA_SESSAO}});
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
      if(motivo === 'entrar') location.hash = currentView; // volta para a mesma tela depois de recarregar
      location.reload(); return 'recarregando';
    }
    if(typeof sincronizarTurmas === 'function') try{ await sincronizarTurmas(); }catch(e){} // tarefa da turma e o resumo para o professor (js/turmas.js)
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
const contaRetorno = () => location.origin + location.pathname; // sem o #: o login volta com ?code=
function contaAceitou(){ return $('#contaAceite').checked; }
function guardarAceite(){ store.set('contaAceite', {versao: TERMOS_VERSAO, maior: true, em: new Date().toISOString()}); }
function contaMsg(txt, cls){
  const m = $(contaUsuario ? '#contaMsgDentro' : '#contaMsg');
  m.className = 'conta-msg' + (cls === 'bad' ? ' erro' : cls === 'ok' ? ' ok' : ''); m.textContent = txt;
}
function contaSemSite(){ if(location.protocol.startsWith('http')) return false; contaMsg(t('A conta só funciona no site (bandoly.app), não com o arquivo aberto do computador.'), 'bad'); return true; }
// sem a caixa dos 18 anos marcada, nada segue: a linha da caixa acende e a mensagem explica
function contaPedeAceite(){
  if(contaAceitou()) return true;
  $('#contaAceiteLinha').classList.add('falta'); $('#contaAceite').focus();
  contaMsg(t('Para continuar, marque a caixa: 18 anos ou mais e os Termos.'), 'bad');
  return false;
}
$('#contaAceite').onchange = ()=>{ if(contaAceitou()){ $('#contaAceiteLinha').classList.remove('falta'); contaMsg(''); } };

$('#contaGoogle').onclick = async ()=>{
  if(!contaPedeAceite() || contaSemSite()) return;
  guardarAceite(); contarUso('conta-google');
  try{ sessionStorage.setItem('bandoly-conta-volta', contaVoltaPara); }catch(e){}
  try{ await carregarSupabase(); const r = await sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: contaRetorno()}}); if(r.error) throw r.error; }
  catch(e){ contaMsg(t('Não deu para abrir o login do Google. Confira a internet e tente de novo.'), 'bad'); }
};

// Passo 2: "Confira o seu e-mail", com o atalho para o webmail mais comum e o reenvio depois de um minuto
const WEBMAILS = [
  [/^(gmail|googlemail)\.com$/, 'Gmail', 'https://mail.google.com/mail/u/0/#inbox'],
  [/^(outlook|hotmail|live|msn)\.com(\.br)?$/, 'Outlook', 'https://outlook.live.com/mail/0/'],
  [/^yahoo\.com(\.br)?$/, 'Yahoo Mail', 'https://mail.yahoo.com/'],
  [/^(icloud|me|mac)\.com$/, 'iCloud Mail', 'https://www.icloud.com/mail'],
  [/^uol\.com\.br$/, 'UOL Mail', 'https://email.uol.com.br/'],
];
function contaPasso2(email){
  contaEnviadoEmail = email;
  $('#contaPasso1').hidden = true; $('#contaPasso2').hidden = false;
  $('#contaEnviadoPara').textContent = email; $('.conta-chip-letra').textContent = email.charAt(0).toUpperCase();
  const dominio = (email.split('@')[1] || '').toLowerCase(), w = WEBMAILS.find(x=>x[0].test(dominio));
  $('#contaAbrirMail').hidden = !w;
  if(w){ $('#contaAbrirMail').href = w[2]; $('#contaAbrirTxt').textContent = t('Abrir o {}', w[1]); }
  contaReenvioAte = Date.now() + 60000; contaReenvioTick();
}
function contaReenvioTick(){
  clearTimeout(contaReenvioTimer);
  const b = $('#contaReenviar'), falta = Math.ceil((contaReenvioAte - Date.now()) / 1000);
  b.disabled = falta > 0;
  b.textContent = falta > 0 ? t('Reenviar em {}', `0:${String(falta).padStart(2, '0')}`) : t('Reenviar o link');
  if(falta > 0 && !$('#contaPasso2').hidden) contaReenvioTimer = setTimeout(contaReenvioTick, 1000);
}
function contaPasso1(){
  clearTimeout(contaReenvioTimer);
  $('#contaPasso2').hidden = true; $('#contaPasso1').hidden = false; contaMsg('');
  $('#contaEmail').focus();
}
async function contaEnviarLink(email){
  await carregarSupabase();
  const r = await sb.auth.signInWithOtp({email, options:{emailRedirectTo: contaRetorno(), shouldCreateUser: true, data:{aceite_versao: TERMOS_VERSAO, declarou_maior: true}}});
  if(r.error) throw r.error;
}
$('#contaEmailForm').onsubmit = async e=>{
  e.preventDefault();
  const email = $('#contaEmail').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ contaMsg(t('Confira o e-mail digitado.'), 'bad'); $('#contaEmail').focus(); return; }
  if(!contaPedeAceite() || contaSemSite()) return;
  guardarAceite(); $('#contaEnviar').disabled = true; contaMsg(t('Enviando…'));
  try{ sessionStorage.setItem('bandoly-conta-volta', contaVoltaPara); }catch(e){}
  try{ await contaEnviarLink(email); contaMsg(''); contaPasso2(email); contarUso('conta-email'); }
  catch(err){ contaMsg(t('Não deu para enviar o link agora. Confira o e-mail digitado e tente de novo em alguns minutos.'), 'bad'); }
  finally{ $('#contaEnviar').disabled = false; }
};
$('#contaOutro').onclick = contaPasso1;
$('#contaVoltar').onclick = contaPasso1;
$('#contaReenviar').onclick = async ()=>{
  if(!contaEnviadoEmail) return;
  try{ await contaEnviarLink(contaEnviadoEmail); avisar(`<span>${t('Enviamos um novo link.')}</span>`); contaReenvioAte = Date.now() + 60000; contaReenvioTick(); }
  catch(e){ avisar(`<span>${t('Não deu para reenviar agora. Tente de novo em alguns minutos.')}</span>`); }
};

$('#contaSincronizar').onclick = ()=>sincronizarConta('botao');
async function sairConta(){
  if(!sb) return;
  await sincronizarConta('saindo');
  await sb.auth.signOut(); contaUsuario = null; contaUltima = null; renderConta();
  if(areaDe(currentView) === 'perfil') go('inicio');
  avisar(`<span>${t('Você saiu da conta. O progresso continua neste aparelho.')}</span>`);
}
$('#contaSair').onclick = sairConta;
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
  await sb.auth.signOut({scope:'local'}); contaUsuario = null; contaUltima = null; localStorage.removeItem(PREFIX + 'contaAceite');
  renderConta(); contaPasso1(); contaMsg(t('Conta excluída. Os dados da nuvem foram apagados.'), 'ok');
};

/* ---------- Topo: "Entrar" ou o círculo com o menu da conta ---------- */
function contaMenuAberto(abrir){
  $('#contaMenu').hidden = !abrir; $('#contaAv').setAttribute('aria-expanded', abrir);
  if(abrir){ const b = $('#contaMenu [role=menuitem]'); if(b) b.focus(); }
}
$('#contaEntrar').onclick = ()=>go('conta');
$('#contaAv').onclick = e=>{ e.stopPropagation(); contaMenuAberto($('#contaMenu').hidden); };
$('#contaMenu').addEventListener('click', e=>{ const b = e.target.closest('[data-ir]'); if(b){ contaMenuAberto(false); go(b.dataset.ir); } });
$('#contaMenuSair').onclick = ()=>{ contaMenuAberto(false); sairConta(); };
document.addEventListener('click', e=>{ if(!$('#contaMenu').hidden && !e.target.closest('#contaTopo')) contaMenuAberto(false); });
document.addEventListener('keydown', e=>{ if(e.key === 'Escape' && !$('#contaMenu').hidden){ contaMenuAberto(false); $('#contaAv').focus(); } });
// Conta, Conquistas e Ajustes são a área da conta: o botão do topo fica aceso nela; guarda de onde a pessoa veio
ganchosAba.push((v, anterior)=>{
  $('#contaTopo').classList.toggle('on', areaDe(v) === 'perfil');
  if(v === 'conta' && anterior && areaDe(anterior) !== 'perfil') contaVoltaPara = anterior;
  if(!$('#contaMenu').hidden) contaMenuAberto(false);
  if(v === 'conta'){ renderConta(); contarNumeros($('#contaDentro'), '.conta-nums b'); }
});

/* ---------- Tela ---------- */
const contaHora = d => d.toLocaleTimeString(IDIOMAS[state.lang].html, {hour:'2-digit', minute:'2-digit'});
function renderConta(){
  const dentro = !!contaUsuario, u = contaUsuario || {}, email = u.email || '';
  $('#contaFora').hidden = dentro; $('#contaDentro').hidden = !dentro;
  $('#contaEntrar').hidden = dentro; $('#contaAv').hidden = !dentro;
  if(!dentro){ if(!$('#contaMenu').hidden) contaMenuAberto(false); $('#iniOla').textContent = t('Buenas!'); return; }
  const meta = u.user_metadata || {}, nome = String(meta.full_name || meta.name || '').trim().split(/\s+/)[0] || '';
  const letra = (nome || email).charAt(0).toUpperCase() || '?';
  $$('.conta-letra').forEach(x=>x.textContent = letra);
  $$('.conta-email-txt').forEach(x=>x.textContent = email);
  $('.conta-ola').textContent = nome ? t('Olá, {}!', nome) : t('Olá!');
  $('#iniOla').textContent = nome ? t('Buenas, {}!', nome) : t('Buenas!'); // saudação de quem volta, no Início // só o primeiro nome, vindo do Google (Privacidade)
  $('.conta-menu-quem b').textContent = nome || t('Sua conta');
  const google = (u.app_metadata && u.app_metadata.provider) === 'google';
  $('#contaSelo').innerHTML = google ? `${$('.conta-google .conta-g').outerHTML}<span translate="no">Google</span>` : `<svg aria-hidden="true"><use href="#i-mail"/></svg>${t('E-mail')}`;
  const [tit, txt] = contaSincronizando ? [t('Sincronizando…'), '']
    : contaErro ? [t('Não deu para sincronizar'), contaErro]
    : contaUltima ? [t('Tudo salvo na nuvem'), t('Última sincronização às {}', contaHora(contaUltima))]
    : [t('Conectado'), t('O progresso deste aparelho vai para a nuvem automaticamente.')];
  $('#contaEstadoTit').textContent = tit; $('#contaEstado').textContent = txt;
  $('#contaMenuEstado').textContent = contaUltima && !contaErro && !contaSincronizando ? t('Tudo salvo na nuvem · às {}', contaHora(contaUltima)) : tit;
  $('#contaTopo').classList.toggle('erro', !!contaErro); $('#contaTopo').classList.toggle('salvo', !!contaUltima && !contaErro);
  $('#contaSincronizar').disabled = contaSincronizando;
  $('#contaNDias').textContent = Object.keys(state.progress.days || {}).length;
  $('#contaNIns').textContent = Object.keys(state.progress.insignias || {}).length;
  $('#contaNMel').textContent = customMelodies().length;
}

// Ao abrir: volta do login (?code=… ou ?error=…) ou já havia login neste navegador → carrega a biblioteca e sincroniza.
// Depois do login a pessoa volta para a tela onde estava, com um aviso.
async function iniciarConta(){
  const q = new URLSearchParams(location.search), voltou = q.has('code') || q.has('error_description');
  if(!voltou && !localStorage.getItem(SUPA_SESSAO)) return;
  try{ await carregarSupabase(); }catch(e){ return; } // sem internet: fica tudo no aparelho
  const {data} = await sb.auth.getSession(); // espera a troca do ?code= pelo login
  contaUsuario = data && data.session ? data.session.user : null;
  renderConta();
  if(voltou){
    history.replaceState(null, '', location.pathname + location.hash);
    let volta = ''; try{ volta = sessionStorage.getItem('bandoly-conta-volta') || ''; sessionStorage.removeItem('bandoly-conta-volta'); }catch(e){}
    if(q.has('error_description') || !contaUsuario){ go('conta'); contaMsg(t('O link de acesso expirou ou já foi usado. Peça um novo.'), 'bad'); }
    else{ go(volta && $('#v-' + volta) && areaDe(volta) !== 'perfil' ? volta : 'conta'); try{ sessionStorage.setItem('bandoly-conta-ola', '1'); }catch(e){} contarUso('conta-entrou'); }
  }
  if(!contaUsuario) return;
  const r = await sincronizarConta(voltou ? 'entrar' : 'inicio');
  if(r === 'recarregando') return;
  try{ if(sessionStorage.getItem('bandoly-conta-ola')){ sessionStorage.removeItem('bandoly-conta-ola'); avisar(`<span>${t('Pronto, você entrou. O seu progresso está salvo na nuvem.')}</span>`); } }catch(e){}
}
renderConta();
const contaPronta = iniciarConta().catch(()=>{}); // quem depende do login (js/turmas.js) espera por aqui
