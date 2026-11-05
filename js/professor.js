/* ================== Para professores: tarefa por link, relatório e digitação ================== */
// Tarefa = um link do BanDoly com o exercício, o modo, a velocidade, a mensagem e, se o professor
// definiu, a digitação. Tudo vai dentro do próprio link (#tarefa=…), sem servidor nem cadastro.
// O aluno abre o link, faz o exercício e, no fim, manda o relatório por WhatsApp, e-mail ou cópia.
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
['#prNome','#prMsg','#prDedos'].forEach(id=>$(id).addEventListener('input', sincronizarProfessor));
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
  const tf = {ex:ex.id, modo, vel:+vel, prof:$('#prNome').value.trim(), msg:$('#prMsg').value.trim()};
  const pr = $('#prPrevia'); pr.innerHTML = avisoTarefaHTML(tf, true);
  pr.classList.remove('muda'); void pr.offsetWidth; pr.classList.add('muda');
  $('#prResumo').innerHTML = [
    ['cap', t('Nível {} · {}', ex.nivel, t(ex.titulo))], ['target', t('Modo {}', t(MODOS[modo]))], ['metro', t('Velocidade {}%', vel)],
    ['keys', $('#prDedos').checked ? t('Com a sua digitação') : t('Sem digitação: o instrutor dá dicas de posição')],
  ].map(([i, x])=>`<li><svg aria-hidden="true"><use href="#i-${i}"/></svg>${escHtml(x)}</li>`).join('');
  $('#prSaida').hidden = true;
}
$('#prEx').onchange = ()=>{ const ex = exercicioPorId($('#prEx').value); $('#prDedos').checked = !!(ex && digitacaoDe(ex.id)); sincronizarProfessor(); };
function linkTarefa(){
  const ex = exercicioPorId($('#prEx').value); if(!ex) return '';
  const d = {v:1, ex:ex.id, modo:$('#prModo').value, vel:+$('#prVel').value, prof:$('#prNome').value.trim(), msg:$('#prMsg').value.trim()};
  if(ex.minha){ d.titulo = ex.titulo; d.texto = ex.texto; } // partitura própria: vai inteira no link
  if($('#prDedos').checked){ const dg = digitacaoDe(ex.id); if(dg) d.dedos = dg; }
  const base = location.protocol==='file:' ? location.href.split('#')[0] : location.origin + location.pathname;
  return base + '#tarefa=' + b64url.para(JSON.stringify(d));
}
function textoTarefa(url){
  const ex = exercicioPorId($('#prEx').value), nome = $('#prNome').value.trim(), msg = $('#prMsg').value.trim();
  return t('Tarefa de bandoneon{}: {} (modo {}). Abra no BanDoly: {}', nome ? ' (' + nome + ')' : '', t(ex.titulo), t(MODOS[$('#prModo').value]), url) + (msg ? '\n\n' + msg : '');
}
$('#prGerar').onclick = ()=>{
  store.set('profNome', $('#prNome').value.trim());
  const url = linkTarefa(); if(!url) return;
  $('#prLink').value = url; $('#prSaida').hidden = false; $('#prCopiado').textContent = '';
  $('#prSaida').dataset.texto = textoTarefa(url);
  // histórico das últimas tarefas, para mandar de novo
  const ex = exercicioPorId($('#prEx').value), h = store.get('profHist', []).filter(x=>x.link!==url);
  h.unshift({data:dayKey(), titulo:ex.titulo, modo:$('#prModo').value, link:url, texto:$('#prSaida').dataset.texto}); store.set('profHist', h.slice(0, 8));
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
  $('#prHist').innerHTML = h.length ? h.map((x, i)=>`<li><div><b>${escHtml(t(x.titulo))}</b><span class="muted">${new Date(x.data+'T12:00').toLocaleDateString(IDIOMAS[state.lang].html)} · ${t(MODOS[x.modo]||'Praticar')}</span></div>
      <button type="button" class="btn ghost" data-hist="${i}">${t('Mandar de novo')}</button></li>`).join('')
    : `<li class="muted">${t('As tarefas que você gerar aparecem aqui para mandar de novo.')}</li>`;
}
$('#prHist').addEventListener('click', e=>{ const b = e.target.closest('[data-hist]'); if(!b) return; const x = store.get('profHist', [])[+b.dataset.hist]; if(x) compartilhar(t('Tarefa do BanDoly'), x.texto); });
$('#prNome').value = store.get('profNome', '');

/* ---------- Abrir uma tarefa recebida (#tarefa=… no endereço) ---------- */
function abrirTarefa(codigo){
  let d; try{ d = JSON.parse(b64url.de(codigo)); }catch(e){ avisar(`<span>${t('Este link de tarefa está incompleto ou foi copiado pela metade.')}</span>`); return; }
  let exId = d.ex;
  if(d.texto){ // partitura do professor: entra em Minhas partituras (uma vez só)
    const igual = minhasPartituras().find(p=>p.texto===d.texto);
    if(igual) exId = igual.id; else { try{ salvarPartitura(d.titulo || t('Tarefa do professor'), d.texto, t('tarefa do professor')); exId = acad.ex.id; }catch(e){ return; } }
  }
  if(!exercicioPorId(exId)){ avisar(`<span>${t('O exercício desta tarefa não existe nesta versão do app.')}</span>`); return; }
  if(d.dedos){ const dg = digitacoes(); dg[exId] = d.dedos; store.set('digitacoes', dg); }
  store.set('tarefa', {ex:exId, modo:d.modo, vel:d.vel, prof:d.prof||'', msg:d.msg||'', recebida:dayKey()});
  history.replaceState(null, '', location.pathname + location.search); // recarregar a página não importa de novo
  go('academia'); comecarTarefa();
}
function comecarTarefa(){
  const tf = store.get('tarefa', null); if(!tf || !exercicioPorId(tf.ex)) return;
  carregarExercicio(tf.ex);
  if(tf.modo && MODOS[tf.modo]) $(`#acModo [data-modo="${tf.modo}"]`).click();
  if(tf.vel){ $('#acVel').value = tf.vel; $('#acVelVal').textContent = tf.vel + '%'; }
  renderTarefa();
}
function avisoTarefaHTML(tf, previa){
  const ex = exercicioPorId(tf.ex); if(!ex) return '';
  return `<span class="tarefa-ic"><svg aria-hidden="true"><use href="#i-cap"/></svg></span>
    <div><b>${tf.prof ? `Tarefa de ${escHtml(tf.prof)}` : 'Tarefa do professor'}: ${escHtml(t(ex.titulo))}</b>
    <div class="muted">${tf.msg ? escHtml(tf.msg) : `Modo ${t(MODOS[tf.modo]||'Praticar')}, ${tf.vel||70}% da velocidade.`}</div></div>
    <div class="row"><button type="button" class="btn" ${previa ? 'tabindex="-1" disabled' : 'data-tarefa="abrir"'}>Fazer a tarefa</button>${previa ? '' : '<button type="button" class="btn ghost" data-tarefa="fim">Dispensar</button>'}</div>`;
}
function renderTarefa(){
  const tf = store.get('tarefa', null), ok = tf && exercicioPorId(tf.ex);
  $$('.tarefa-aviso').forEach(el=>{ el.hidden = !ok; if(ok) el.innerHTML = avisoTarefaHTML(tf, false); });
}
document.addEventListener('click', e=>{
  const b = e.target.closest('[data-tarefa]'); if(!b) return;
  if(b.dataset.tarefa==='abrir'){ go('academia'); comecarTarefa(); }
  else { store.set('tarefa', null); renderTarefa(); }
});

/* ---------- Relatório para o professor ---------- */
// Chamada no fim de cada tentativa da Academia (acadFim): acrescenta o botão de enviar
function aposRelatorio(){
  const rel = $('#acRelatorio'); if(!rel || !acad.ex) return;
  const tf = store.get('tarefa', null), daTarefa = tf && tf.ex===acad.ex.id;
  const cab = [t('BanDoly · Relatório da Academia'),
    t('Exercício: Nível {} · {}', acad.ex.nivel, t(acad.ex.titulo)),
    t('Modo: {} · velocidade {}%', t(MODOS[acad.modo]), $('#acVel').value),
    t('Data: {}', new Date().toLocaleString(IDIOMAS[state.lang].html, {dateStyle:'short', timeStyle:'short'}))];
  if(daTarefa && tf.prof) cab.push(t('Tarefa de {}', tf.prof));
  const corpo = rel.innerText.split('\n').map(l=>l.trim()).filter(Boolean).join('\n');
  rel.insertAdjacentHTML('beforeend', `<div class="row ac-enviar"><button type="button" class="btn" id="acEnviarRel"><svg aria-hidden="true"><use href="#i-share"/></svg>${t('Enviar ao professor')}</button></div>`);
  $('#acEnviarRel').onclick = ()=>compartilhar(t('Relatório do BanDoly'), cab.join('\n') + '\n\n' + corpo);
}

/* ---------- Editor de digitação (Academia) ---------- */
let editandoDedos = false;
function alternarEdicaoDedos(){
  if(!acad.ex) return;
  if(acad.ex.gerar){ acadFeed(t('Este exercício é sorteado a cada rodada: não dá para fixar a digitação.'), 'bad'); return; }
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
  pop.style.left = Math.max(0, Math.min(base.width-230, r.left-base.left-60)) + 'px'; pop.style.top = (r.bottom-base.top+6) + 'px';
  pop.hidden = false;
}, true);
$('#acDedoPop').addEventListener('click', e=>{
  const b = e.target.closest('[data-ev]'); if(!b) return;
  const id = b.dataset.ev, n = b.dataset.dedo ? +b.dataset.dedo : null;
  salvarDedo(acad.ex.id, id, n);
  for(const lista of [acad.todos, acad.eventos]) lista.forEach(ev=>{ if(ev.id===id){ ev.dedo = n; ev.fonte = n==null ? null : 'professor'; } });
  renderFaixa(); acadInstrutor(Math.max(0, acad.g)); $('#acDedoPop').hidden = true;
});
document.addEventListener('click', e=>{ if(!e.target.closest('#acDedoPop,#acStrip')) $('#acDedoPop').hidden = true; });

ganchosAba.push(v=>{ if(v==='professor'){ preencherExerciciosProfessor(); $('#prEx').onchange(); renderHistorico(); } if(v==='academia' || v==='estudo') renderTarefa(); });
renderTarefa();
