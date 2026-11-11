/* ================== Para professores: tarefa por link, relatório e digitação ================== */
// Tarefa = um link do BanDoly com o exercício, o modo, a velocidade, a mensagem e, se o professor
// definiu, a digitação. Tudo vai dentro do próprio link (#tarefa=…), sem servidor nem cadastro.
// O aluno abre o link, faz o exercício e, no fim, manda o relatório por WhatsApp, e-mail ou cópia.
// Plano: o link pode levar vários exercícios em ordem e uma data de entrega ("Entregar até").
// Relatório: além do texto, vai um link (#relatorio=…) que o professor abre em Professores → Relatórios
// (js/relatorio.js). Também vai tudo dentro do link: nada passa por servidor.
// Digitação: o professor escolhe o dedo de cada nota (2 a 5; os polegares não tocam botões). Ela fica
// guardada por exercício em store 'digitacoes' = {exercicio: {idDoEvento: dedo}} e aparece como
// "digitação do professor": o app continua sem conferir o dedo.
const b64url = {
  para: s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''),
  de: s => decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))),
};
const digitacoes = () => store.get('digitacoes', {});
function digitacaoDe(exId){ return digitacoes()[exId] || null; }
function salvarDedo(exId, evId, dedo){
  const d = digitacoes(), x = d[exId] = d[exId] || {};
  if(dedo==null) delete x[evId]; else x[evId] = dedo;
  if(!Object.keys(x).length) delete d[exId];
  store.set('digitacoes', d);
}

/* ---------- Compartilhar um texto (tarefa ou relatório) ---------- */
let partilhaTexto = '';
function compartilhar(titulo, texto){
  partilhaTexto = texto;
  $('#partilhaTit').textContent = titulo; $('#partilhaTexto').value = texto; $('#partilhaMsg').textContent = '';
  $('#partilhaNativo').hidden = !navigator.share;
  $('#partilha').showModal();
}
$('#partilhaCopiar').onclick = async ()=>{
  try{ await navigator.clipboard.writeText(partilhaTexto); }catch(e){ $('#partilhaTexto').select(); document.execCommand('copy'); }
  $('#partilhaMsg').textContent = 'Copiado! Agora é só colar na conversa.';
};
$('#partilhaWhats').onclick = ()=>window.open('https://wa.me/?text=' + encodeURIComponent(partilhaTexto), '_blank', 'noopener');
$('#partilhaEmail').onclick = ()=>{ location.href = 'mailto:?subject=' + encodeURIComponent($('#partilhaTit').textContent) + '&body=' + encodeURIComponent(partilhaTexto); };
$('#partilhaNativo').onclick = ()=>navigator.share({title:$('#partilhaTit').textContent, text:partilhaTexto}).catch(()=>{});
$('#partilhaFechar').onclick = ()=>$('#partilha').close();

/* ---------- Montar uma tarefa (aba Para professores) ----------
   Três passos: (1) o exercício, em cartões com busca e filtro por nível; (2) o modo, a velocidade e a
   digitação; (3) o nome e a mensagem. Ao lado, a prévia de como o aluno vai ver, o link e o histórico.
   Os seletores escondidos #prEx e #prModo guardam a escolha (o resto do código lê deles). */
const MODOS = {aprender:'Aprender', praticar:'Praticar', desafio:'Desafio'};
let prNivel = 'todos';
const semAcentoPr = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function preencherExerciciosProfessor(){
  const sel = $('#prEx'), atual = sel.value || (acad.ex && acad.ex.id);
  const niveis = ACADEMIA.filter(n=>n.exercicios.some(e=>!e.pendente));
  sel.innerHTML = niveis.map(n=>n.exercicios.filter(e=>!e.pendente).map(e=>`<option value="${e.id}">${escHtml(t(e.titulo))}</option>`).join('')).join('');
  $('#prNiveis').innerHTML = `<button type="button" data-nivel="todos" class="${prNivel==='todos'?'on':''}">${t('Todos')}</button>`
    + niveis.map(n=>`<button type="button" data-nivel="${n.nivel}" class="${prNivel==n.nivel?'on':''}" title="${escHtml(t(n.titulo))}">${n.nivel===7 ? t('Minhas') : t('Nível {}', n.nivel)}</button>`).join('');
  sel.value = exercicioPorId(atual) && !exercicioPorId(atual).pendente ? atual : sel.options[0].value;
  renderCartoesProfessor();
}
function renderCartoesProfessor(){
  const busca = semAcentoPr($('#prBusca').value.trim()), escolhido = $('#prEx').value;
  const cards = ACADEMIA.filter(n=>prNivel==='todos' || prNivel==n.nivel).flatMap(n=>n.exercicios.filter(e=>!e.pendente).map(e=>({e, n})))
    .filter(({e, n})=>!busca || semAcentoPr(`${t(e.titulo)} ${t(e.desc||'')} ${t(n.titulo)}`).includes(busca));
  $('#prExs').innerHTML = cards.length ? cards.map(({e, n}, i)=>`<button type="button" role="option" class="pr-ex nivel-${n.nivel} ${e.id===escolhido?'on':''}" data-ex="${e.id}" aria-selected="${e.id===escolhido}" style="--i:${i}">
      <span class="pr-ex-nivel">${n.nivel===7 ? t('Minhas partituras') : t('Nível {}', n.nivel)}</span><b>${escHtml(t(e.titulo))}</b><small>${escHtml(t(e.desc||''))}</small></button>`).join('')
    : `<p class="muted pr-vazio">${t('Nenhum exercício encontrado.')}</p>`;
}
$('#prNiveis').addEventListener('click', e=>{ const b = e.target.closest('[data-nivel]'); if(!b) return; prNivel = b.dataset.nivel; preencherExerciciosProfessor(); });
$('#prBusca').addEventListener('input', renderCartoesProfessor);
$('#prExs').addEventListener('click', e=>{ const b = e.target.closest('[data-ex]'); if(!b) return; $('#prEx').value = b.dataset.ex; $('#prEx').onchange(); });
$('#prModos').addEventListener('click', e=>{ const b = e.target.closest('[data-modo]'); if(!b) return; $('#prModo').value = b.dataset.modo; sincronizarProfessor(); });
$('#prVel').addEventListener('input', sincronizarProfessor);
['#prNome','#prMsg','#prDedos','#prPrazo'].forEach(id=>$(id).addEventListener('input', sincronizarProfessor));
$('#prDedos').addEventListener('change', sincronizarProfessor);
$('#prSugs').addEventListener('click', e=>{ const b = e.target.closest('.pr-sug'); if(!b) return; $('#prMsg').value = b.textContent; sincronizarProfessor(); $('#prMsg').focus(); });
$('#prDefDedos').onclick = ()=>{ const id = $('#prEx').value; go('academia'); carregarExercicio(id); if(!editandoDedos) alternarEdicaoDedos(); $('#acStrip').scrollIntoView({behavior: movReduzido()?'auto':'smooth', block:'center'}); };
// Mostra a escolha atual em todo lugar: cartões, modos, velocidade, digitação, prévia e resumo
function sincronizarProfessor(){
  const ex = exercicioPorId($('#prEx').value); if(!ex) return;
  const modo = $('#prModo').value, vel = $('#prVel').value, tem = !!digitacaoDe(ex.id) && !ex.gerar;
  $$('#prExs [data-ex]').forEach(b=>{ const on = b.dataset.ex===ex.id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  $$('#prModos [data-modo]').forEach(b=>{ const on = b.dataset.modo===modo; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $('#prVelTxt').textContent = vel + '%';
  $('#prVel').style.setProperty('--v', (vel-40)/80);
  $('#prDedos').disabled = !tem; if(!tem) $('#prDedos').checked = false;
  $('#prDedosInfo').textContent = ex.gerar ? 'Este exercício é sorteado a cada rodada: não dá para fixar a digitação.'
    : tem ? 'Você já definiu a digitação deste exercício.' : 'Este exercício ainda não tem digitação definida por você.';
  $('#prDefDedos').hidden = !!ex.gerar;
  const dados = dadosTarefa(), tf = tarefaDeDados(dados);
  const pr = $('#prPrevia'); pr.innerHTML = avisoTarefaHTML(tf, true);
  pr.classList.remove('muda'); void pr.offsetWidth; pr.classList.add('muda');
  $('#prResumo').innerHTML = [
    ...(prPlano.length ? [] : [['cap', t('Nível {} · {}', ex.nivel, t(ex.titulo))], ['target', t('Modo {}', t(MODOS[modo]))], ['metro', t('Velocidade {}%', vel)],
    ['keys', $('#prDedos').checked ? t('Com a sua digitação') : t('Sem digitação: o instrutor dá dicas de posição')]]),
    ...(dados.prazo ? [['check', t('Entregar até {}', dataCurta(dados.prazo))]] : []),
  ].map(([i, x])=>`<li><svg aria-hidden="true"><use href="#i-${i}"/></svg>${escHtml(x)}</li>`).join('');
  $('#prSaida').hidden = true;
}
$('#prEx').onchange = ()=>{ const ex = exercicioPorId($('#prEx').value); $('#prDedos').checked = !!(ex && digitacaoDe(ex.id)); sincronizarProfessor(); };
/* Plano: vários exercícios numa tarefa só. O professor monta um exercício de cada vez e o acrescenta à lista;
   com a lista vazia, o link leva só o exercício escolhido (como sempre foi). */
let prPlano = [];
const PLANO_MAX = 6;
const baseDoApp = () => location.protocol==='file:' ? location.href.split('#')[0] : location.origin + location.pathname;
const dataCurta = iso => new Date(iso + 'T12:00').toLocaleDateString(IDIOMAS[state.lang].html, {day:'2-digit', month:'2-digit'});
function itemAtualProfessor(){
  const ex = exercicioPorId($('#prEx').value); if(!ex) return null;
  const it = {ex:ex.id, modo:$('#prModo').value, vel:+$('#prVel').value};
  if(ex.minha){ it.titulo = ex.titulo; it.texto = ex.texto; } // partitura própria: vai inteira no link
  if($('#prDedos').checked){ const dg = digitacaoDe(ex.id); if(dg) it.dedos = dg; }
  return it;
}
// O que vai dentro do link (e para a turma): um exercício (v1) ou um plano de vários (v2)
function dadosTarefa(){
  const comum = {prof:$('#prNome').value.trim(), msg:$('#prMsg').value.trim()};
  if($('#prPrazo').value) comum.prazo = $('#prPrazo').value;
  if(prPlano.length) return {v:2, itens:prPlano.slice(), ...comum};
  const it = itemAtualProfessor(); return it ? {v:1, ...it, ...comum} : null;
}
// A mesma tarefa no formato em que o aluno a guarda (para a prévia)
function tarefaDeDados(d){
  return {prof:d.prof||'', msg:d.msg||'', prazo:d.prazo||'', i:0, itens:(d.itens || [d]).map(x=>({ex:x.ex, modo:x.modo, vel:x.vel}))};
}
function linkTarefa(){
  const d = dadosTarefa(); if(!d) return '';
  return baseDoApp() + '#tarefa=' + b64url.para(JSON.stringify(d));
}
function textoTarefa(url){
  const d = dadosTarefa(), nome = d.prof ? ' (' + d.prof + ')' : '';
  const cab = d.itens ? t('Tarefa de bandoneon{}: {} exercícios. Abra no BanDoly: {}', nome, d.itens.length, url)
    : t('Tarefa de bandoneon{}: {} (modo {}). Abra no BanDoly: {}', nome, t(exercicioPorId(d.ex).titulo), t(MODOS[d.modo]), url);
  return cab + (d.prazo ? '\n' + t('Entregar até {}.', dataCurta(d.prazo)) : '') + (d.msg ? '\n\n' + d.msg : '');
}
function renderPlano(){
  $('#prPlanoBox').hidden = !prPlano.length;
  $('#prPlanoLista').innerHTML = prPlano.map((it, i)=>`<li><div><b>${escHtml(t(exercicioPorId(it.ex).titulo))}</b><span class="muted">${t('Modo {}', t(MODOS[it.modo]))} · ${it.vel}%</span></div>
    <button type="button" class="pr-tirar" data-tirar="${i}" aria-label="${t('Tirar do plano')}"><svg aria-hidden="true"><use href="#i-x"/></svg></button></li>`).join('');
  $('#prGerarTxt').textContent = prPlano.length ? t('Gerar o link do plano ({} exercícios)', prPlano.length) : t('Gerar o link da tarefa');
}
$('#prAdd').onclick = ()=>{
  const it = itemAtualProfessor(); if(!it) return;
  const k = prPlano.findIndex(x=>x.ex===it.ex);
  if(k>=0) prPlano[k] = it;
  else if(prPlano.length>=PLANO_MAX){ avisar(`<span>${t('O plano leva até {} exercícios.', PLANO_MAX)}</span>`); return; }
  else prPlano.push(it);
  renderPlano(); sincronizarProfessor();
  avisar(`<span>${t('Adicionado ao plano. Escolha o próximo exercício ou gere o link.')}</span>`);
};
$('#prPlanoLista').addEventListener('click', e=>{ const b = e.target.closest('[data-tirar]'); if(!b) return; prPlano.splice(+b.dataset.tirar, 1); renderPlano(); sincronizarProfessor(); });
$('#prGerar').onclick = ()=>{ contarUso('tarefa-gerada');
  store.set('profNome', $('#prNome').value.trim());
  const d = dadosTarefa(), url = linkTarefa(); if(!url) return;
  $('#prLink').value = url; $('#prSaida').hidden = false; $('#prCopiado').textContent = '';
  $('#prSaida').dataset.texto = textoTarefa(url);
  // histórico das últimas tarefas, para mandar de novo
  const primeiro = d.itens ? d.itens[0] : d, h = store.get('profHist', []).filter(x=>x.link!==url);
  h.unshift({data:dayKey(), ex:primeiro.ex, titulo:exercicioPorId(primeiro.ex).titulo, n:d.itens ? d.itens.length : 1, modo:primeiro.modo, link:url, texto:$('#prSaida').dataset.texto}); store.set('profHist', h.slice(0, 8));
  renderHistorico();
};
$('#prCopiar').onclick = async ()=>{
  try{ await navigator.clipboard.writeText($('#prSaida').dataset.texto); }catch(e){ $('#prLink').select(); document.execCommand('copy'); }
  $('#prCopiado').textContent = 'Copiado! Agora é só colar na conversa com o aluno.';
  const b = $('#prCopiar'); b.classList.remove('feito'); void b.offsetWidth; b.classList.add('feito');
};
$('#prWhats').onclick = ()=>window.open('https://wa.me/?text=' + encodeURIComponent($('#prSaida').dataset.texto), '_blank', 'noopener');
$('#prEnviar').onclick = ()=>compartilhar(t('Tarefa do BanDoly'), $('#prSaida').dataset.texto);
function renderHistorico(){
  const h = store.get('profHist', []);
  $('#prHist').innerHTML = h.length ? h.map((x, i)=>`<li><div><b>${x.n>1 ? t('Plano: {} exercícios', x.n) : escHtml(t(x.ex && exercicioPorId(x.ex) ? exercicioPorId(x.ex).titulo : x.titulo))}</b><span class="muted">${new Date(x.data+'T12:00').toLocaleDateString(IDIOMAS[state.lang].html)}${x.n>1 ? '' : ' · ' + t(MODOS[x.modo]||'Praticar')}</span></div>
      <button type="button" class="btn ghost" data-hist="${i}">${t('Mandar de novo')}</button></li>`).join('')
    : `<li class="muted">${t('As tarefas que você gerar aparecem aqui para mandar de novo.')}</li>`;
}
$('#prHist').addEventListener('click', e=>{ const b = e.target.closest('[data-hist]'); if(!b) return; const x = store.get('profHist', [])[+b.dataset.hist]; if(x) compartilhar(t('Tarefa do BanDoly'), x.texto); });
$('#prNome').value = store.get('profNome', '');

/* ---------- Abrir uma tarefa recebida (#tarefa=… no endereço) ----------
   A tarefa guardada: {prof, msg, prazo, recebida, i, itens:[{ex, modo, vel, feito, vz, rel}]}; ex, modo e vel
   na raiz repetem o item atual. Vinda de uma turma, leva também {turma, em} (js/turmas.js). */
function tarefaGuardada(){
  const tf = store.get('tarefa', null); if(!tf) return null;
  if(!tf.itens){ tf.itens = [{ex:tf.ex, modo:tf.modo, vel:tf.vel}]; tf.i = 0; } // recebida antes de existirem os planos
  tf.itens = tf.itens.filter(x=>exercicioPorId(x.ex)); if(!tf.itens.length) return null;
  tf.i = Math.min(tf.i||0, tf.itens.length-1);
  return tf;
}
function guardarTarefa(tf){
  if(tf){ const a = tf.itens[tf.i]; tf.ex = a.ex; tf.modo = a.modo; tf.vel = a.vel; }
  store.set('tarefa', tf);
}
// Guarda a tarefa que veio de um link ou de uma turma. Devolve false se nenhum exercício dela existe aqui.
function receberTarefa(d, extra){
  const itens = [];
  for(const b of (Array.isArray(d.itens) ? d.itens.slice(0, 8) : [d])){
    let exId = b.ex;
    if(b.texto){ // partitura do professor: entra em Minhas partituras (uma vez só)
      const igual = minhasPartituras().find(p=>p.texto===b.texto);
      if(igual) exId = igual.id; else { try{ salvarPartitura(b.titulo || t('Tarefa do professor'), b.texto, t('tarefa do professor')); exId = acad.ex.id; }catch(e){ continue; } }
    }
    if(!exercicioPorId(exId)) continue;
    if(b.dedos){ const dg = digitacoes(); dg[exId] = b.dedos; store.set('digitacoes', dg); }
    itens.push({ex:exId, modo:MODOS[b.modo] ? b.modo : 'praticar', vel:Math.max(40, Math.min(120, +b.vel||70))});
  }
  if(!itens.length) return false;
  guardarTarefa({prof:String(d.prof||'').slice(0, 40), msg:String(d.msg||'').slice(0, 300), prazo:/^\d{4}-\d\d-\d\d$/.test(d.prazo||'') ? d.prazo : '',
    recebida:dayKey(), i:0, itens, ...(extra||{})});
  return true;
}
function abrirTarefa(codigo){
  let d; try{ d = JSON.parse(b64url.de(codigo)); }catch(e){ avisar(`<span>${t('Este link de tarefa está incompleto ou foi copiado pela metade.')}</span>`); return; }
  if(!d || !receberTarefa(d)){ avisar(`<span>${t('O exercício desta tarefa não existe nesta versão do app.')}</span>`); return; }
  history.replaceState(null, '', location.pathname + location.search); // recarregar a página não importa de novo
  go('academia'); comecarTarefa();
}
function comecarTarefa(i){
  const tf = tarefaGuardada(); if(!tf) return;
  if(i!=null && tf.itens[i]){ tf.i = i; guardarTarefa(tf); }
  const a = tf.itens[tf.i];
  carregarExercicio(a.ex);
  if(a.modo && MODOS[a.modo]) $(`#acModo [data-modo="${a.modo}"]`).click();
  if(a.vel){ $('#acVel').value = a.vel; $('#acVelVal').textContent = a.vel + '%'; }
  renderTarefa();
}
function avisoTarefaHTML(tf, previa){
  const itens = tf.itens.map(x=>({...x, e:exercicioPorId(x.ex)})).filter(x=>x.e); if(!itens.length) return '';
  const quem = tf.prof ? t('Tarefa de {}', tf.prof) : t('Tarefa do professor'), feitos = itens.filter(x=>x.feito).length, tudo = feitos===itens.length;
  const um = itens.length===1 ? itens[0] : null;
  const sub = [tf.msg ? escHtml(tf.msg) : um ? t('Modo {}, {}% da velocidade.', t(MODOS[um.modo]||'Praticar'), um.vel||70) : '',
    tf.prazo ? t('Entregar até {}.', dataCurta(tf.prazo)) : ''].filter(Boolean).join(' ');
  const lista = um ? '' : `<ol class="tarefa-itens">${itens.map((x, i)=>`<li class="${x.feito ? 'feito' : i===tf.i ? 'atual' : ''}"><button type="button" ${previa ? 'tabindex="-1" disabled' : `data-tarefa-item="${i}"`}>
      <span class="tarefa-marca">${x.feito ? '<svg aria-hidden="true"><use href="#i-check"/></svg>' : i+1}</span><span>${escHtml(t(x.e.titulo))}</span>
      <small>${t(MODOS[x.modo]||'Praticar')} · ${x.vel||70}%${x.rel ? ' · ' + x.rel.nota + '%' : ''}</small></button></li>`).join('')}</ol>`;
  const acoes = previa ? `<button type="button" class="btn" tabindex="-1" disabled>${t('Fazer a tarefa')}</button>`
    : (tudo ? `<button type="button" class="btn" data-tarefa="enviar"><svg aria-hidden="true"><use href="#i-share"/></svg>${t('Enviar o relatório')}</button><button type="button" class="btn sec" data-tarefa="abrir">${t('Fazer de novo')}</button>`
        : `<button type="button" class="btn" data-tarefa="abrir">${feitos ? t('Continuar a tarefa') : t('Fazer a tarefa')}</button>`)
      + `<button type="button" class="btn ghost" data-tarefa="fim">${t('Dispensar')}</button>`;
  return `<span class="tarefa-ic"><svg aria-hidden="true"><use href="#i-${tudo && !previa ? 'check' : 'cap'}"/></svg></span>
    <div><b>${escHtml(quem)}: ${um ? escHtml(t(um.e.titulo)) : t('{} exercícios', itens.length)}${tudo && !previa ? ' · ' + t('feita') : ''}</b>
    <div class="muted">${sub}</div>${lista}</div>
    <div class="row">${acoes}</div>`;
}
function renderTarefa(){
  const tf = tarefaGuardada();
  $$('.tarefa-aviso').forEach(el=>{ el.hidden = !tf; if(tf) el.innerHTML = avisoTarefaHTML(tf, false); });
}
document.addEventListener('click', e=>{
  const it = e.target.closest('[data-tarefa-item]'); if(it){ go('academia'); comecarTarefa(+it.dataset.tarefaItem); return; }
  const b = e.target.closest('[data-tarefa]'); if(!b) return;
  if(b.dataset.tarefa==='abrir'){ go('academia'); comecarTarefa(); }
  else if(b.dataset.tarefa==='enviar') enviarRelatorioTarefa();
  else { store.set('tarefa', null); renderTarefa(); }
});
// Fim de uma tentativa: se o exercício é da tarefa, marca como feito e guarda o melhor resultado
function registrarNaTarefa(rel){
  const tf = tarefaGuardada(); if(!tf || !rel) return null;
  let k = tf.itens[tf.i].ex===rel.ex ? tf.i : tf.itens.findIndex(x=>x.ex===rel.ex && !x.feito);
  if(k<0) k = tf.itens.findIndex(x=>x.ex===rel.ex);
  if(k<0) return null;
  const it = tf.itens[k]; it.vz = (it.vz||0) + 1; it.feito = true;
  if(!it.rel || rel.nota >= it.rel.nota) it.rel = rel;
  const prox = tf.itens.findIndex(x=>!x.feito); if(prox>=0) tf.i = prox;
  guardarTarefa(tf); renderTarefa();
  return tf;
}

/* ---------- Relatório para o professor ---------- */
// O link do relatório leva o nome que o aluno digitou e o resultado de cada exercício (o "rel" montado em acadFim)
function linkRelatorio(itens, tf){
  const d = {v:1, aluno:String(store.get('alunoNome', '')).slice(0, 40), data:new Date().toISOString().slice(0, 16), itens};
  if(tf && tf.prof) d.prof = tf.prof;
  return baseDoApp() + '#relatorio=' + b64url.para(JSON.stringify(d));
}
const relsDaTarefa = tf => tf.itens.filter(x=>x.rel).map(x=>({...x.rel, vz:x.vz||1}));
function enviarRelatorioTarefa(){
  const tf = tarefaGuardada(); if(!tf) return;
  const rels = relsDaTarefa(tf); if(!rels.length) return;
  const nome = store.get('alunoNome', '');
  const linhas = [t('BanDoly · Relatório da tarefa'), ...(nome ? [t('Aluno: {}', nome)] : []), ...(tf.prof ? [t('Tarefa de {}', tf.prof)] : []), '',
    ...tf.itens.map(x=>{ const e = exercicioPorId(x.ex); return '• ' + t(e.titulo) + ': ' + (x.rel ? t('{}% ({} tentativa(s))', x.rel.nota, x.vz||1) : t('ainda não feito')); })];
  compartilhar(t('Relatório do BanDoly'), linhas.join('\n') + '\n\n' + t('Ver o relatório com gráficos no BanDoly: {}', linkRelatorio(rels, tf)));
}
// Chamada no fim de cada tentativa da Academia (acadFim): acrescenta o nome e o botão de enviar
function aposRelatorio(){
  const rel = $('#acRelatorio'); if(!rel || !acad.ex) return;
  const tf = registrarNaTarefa(acad.rel), daTarefa = !!tf;
  const cab = [t('BanDoly · Relatório da Academia'),
    t('Exercício: Nível {} · {}', acad.ex.nivel, t(acad.ex.titulo)),
    t('Modo: {} · velocidade {}%', t(MODOS[acad.modo]), $('#acVel').value),
    t('Data: {}', new Date().toLocaleString(IDIOMAS[state.lang].html, {dateStyle:'short', timeStyle:'short'}))];
  if(daTarefa && tf.prof) cab.push(t('Tarefa de {}', tf.prof));
  const corpo = rel.innerText.split('\n').map(l=>l.trim()).filter(Boolean).join('\n');
  rel.insertAdjacentHTML('beforeend', `<div class="row ac-enviar"><label class="ac-rel-nome"><span>${t('Seu nome (aparece no relatório)')}</span><input type="text" id="acRelNome" maxlength="40" autocomplete="given-name"></label>
    <button type="button" class="btn" id="acEnviarRel"><svg aria-hidden="true"><use href="#i-share"/></svg>${t('Enviar ao professor')}</button></div>`);
  $('#acRelNome').value = store.get('alunoNome', '');
  $('#acEnviarRel').onclick = ()=>{
    const nome = $('#acRelNome').value.trim(); if(nome !== store.get('alunoNome', '')) store.set('alunoNome', nome);
    const itens = daTarefa ? relsDaTarefa(tf) : acad.rel ? [acad.rel] : [];
    const url = itens.length ? linkRelatorio(itens, tf) : '';
    compartilhar(t('Relatório do BanDoly'), cab.join('\n') + (nome ? '\n' + t('Aluno: {}', nome) : '') + '\n\n' + corpo + (url ? '\n\n' + t('Ver o relatório com gráficos no BanDoly: {}', url) : ''));
  };
}

/* ---------- Editor de digitação (Academia) ---------- */
let editandoDedos = false;
function alternarEdicaoDedos(){
  if(!acad.ex) return;
  if(acad.ex.gerar){ acadFeed(t('Este exercício é sorteado a cada rodada: não dá para fixar a digitação.')); return; }
  editandoDedos = !editandoDedos; acadParar(); acadPrevia();
  $('#acDigitar').classList.toggle('on', editandoDedos);
  $('#acStrip').classList.toggle('editando', editandoDedos);
  $('#acDedoPop').hidden = true;
  if(editandoDedos){ $('#acGuia').checked = true; renderFaixa(); acadFeed(t('Toque numa nota da faixa para escolher o dedo. Toque em "Editar digitação" de novo para terminar.')); }
  else acadFeed(t('Digitação salva. Ela aparece no instrutor como "digitação do professor".'), 'ok');
}
$('#acDigitar').onclick = alternarEdicaoDedos;
$('#acStrip').addEventListener('click', e=>{
  if(!editandoDedos) return;
  const c = e.target.closest('.mcard'); if(!c) return;
  e.stopPropagation();
  const g = acad.grupos[+c.dataset.g], pop = $('#acDedoPop'); if(!g) return;
  pop.innerHTML = g.ks.map(k=>{ const ev = acad.eventos[k];
    return `<div class="dedo-linha"><span>${noteName(ev.midi)} <small class="muted">${maoNome(ev.mao)}</small></span>
      ${[2,3,4,5].map(n=>`<button type="button" class="${ev.dedo===n?'on':''}" data-ev="${ev.id}" data-dedo="${n}">${n}</button>`).join('')}
      <button type="button" class="${ev.dedo==null?'on':''}" data-ev="${ev.id}" data-dedo="" aria-label="${t('Sem dedo')}">–</button></div>`; }).join('');
  const r = c.getBoundingClientRect(), base = $('#acCentro').getBoundingClientRect();
  pop.hidden = false;
  const acima = r.top - base.top - pop.offsetHeight - 6;
  pop.style.left = Math.max(0, Math.min(base.width-230, r.left-base.left-60)) + 'px'; pop.style.top = (acima >= 0 ? acima : r.bottom-base.top+6) + 'px';
}, true);
$('#acDedoPop').addEventListener('click', e=>{
  const b = e.target.closest('[data-ev]'); if(!b) return;
  const id = b.dataset.ev, n = b.dataset.dedo ? +b.dataset.dedo : null;
  salvarDedo(acad.ex.id, id, n);
  for(const lista of [acad.todos, acad.eventos]) lista.forEach(ev=>{ if(ev.id===id){ ev.dedo = n; ev.fonte = n==null ? null : 'professor'; } });
  renderFaixa(); acadInstrutor(Math.max(0, acad.g)); $('#acDedoPop').hidden = true;
});
document.addEventListener('click', e=>{ if(!e.target.closest('#acDedoPop,#acStrip')) $('#acDedoPop').hidden = true; });

ganchosAba.push(v=>{ if(v==='professor'){ preencherExerciciosProfessor(); $('#prEx').onchange(); renderPlano(); renderHistorico(); } if(v==='academia' || v==='estudo') renderTarefa(); });
renderTarefa();
