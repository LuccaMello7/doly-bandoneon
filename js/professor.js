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

/* ---------- Montar uma tarefa (aba Para professores) ---------- */
const MODOS = {aprender:'Aprender', praticar:'Praticar', desafio:'Desafio'};
function preencherExerciciosProfessor(){
  const sel = $('#prEx'), atual = sel.value;
  sel.innerHTML = ACADEMIA.map(n=>{
    const ex = n.exercicios.filter(e=>!e.pendente); if(!ex.length) return '';
    return `<optgroup label="${escHtml(t('Nível {}: {}', n.nivel, t(n.titulo)))}">${ex.map(e=>`<option value="${e.id}">${escHtml(t(e.titulo))}</option>`).join('')}</optgroup>`;
  }).join('');
  if(atual && exercicioPorId(atual)) sel.value = atual; else if(acad.ex) sel.value = acad.ex.id;
}
function linkTarefa(){
  const ex = exercicioPorId($('#prEx').value); if(!ex) return '';
  const d = {v:1, ex:ex.id, modo:$('#prModo').value, vel:+$('#prVel').value, prof:$('#prNome').value.trim(), msg:$('#prMsg').value.trim()};
  if(ex.minha){ d.titulo = ex.titulo; d.texto = ex.texto; } // partitura própria: vai inteira no link
  if($('#prDedos').checked){ const dg = digitacaoDe(ex.id); if(dg) d.dedos = dg; }
  const base = location.protocol==='file:' ? location.href.split('#')[0] : location.origin + location.pathname;
  return base + '#tarefa=' + b64url.para(JSON.stringify(d));
}
$('#prGerar').onclick = ()=>{
  store.set('profNome', $('#prNome').value.trim());
  const url = linkTarefa(); if(!url) return;
  $('#prLink').value = url; $('#prSaida').hidden = false;
  const ex = exercicioPorId($('#prEx').value), nome = $('#prNome').value.trim();
  $('#prSaida').dataset.texto = t('Tarefa de bandoneon{}: {} (modo {}). Abra no BanDoly: {}', nome ? ' (' + nome + ')' : '', t(ex.titulo), t(MODOS[$('#prModo').value]), url);
};
$('#prEnviar').onclick = ()=>compartilhar(t('Tarefa do BanDoly'), $('#prSaida').dataset.texto);
$('#prEx').onchange = ()=>{ const tem = !!digitacaoDe($('#prEx').value); $('#prDedos').disabled = !tem; $('#prDedos').checked = tem;
  $('#prDedosInfo').textContent = tem ? '' : 'Este exercício ainda não tem digitação definida por você.'; };
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
function renderTarefa(){
  const tf = store.get('tarefa', null), ok = tf && exercicioPorId(tf.ex);
  $$('.tarefa-aviso').forEach(el=>{
    el.hidden = !ok; if(!ok) return;
    const ex = exercicioPorId(tf.ex);
    el.innerHTML = `<span class="tarefa-ic"><svg aria-hidden="true"><use href="#i-cap"/></svg></span>
      <div><b>${tf.prof ? `Tarefa de ${escHtml(tf.prof)}` : 'Tarefa do professor'}: ${escHtml(t(ex.titulo))}</b>
      <div class="muted">${tf.msg ? escHtml(tf.msg) : `Modo ${t(MODOS[tf.modo]||'Praticar')}, ${tf.vel||70}% da velocidade.`}</div></div>
      <div class="row"><button type="button" class="btn" data-tarefa="abrir">Fazer a tarefa</button><button type="button" class="btn ghost" data-tarefa="fim">Dispensar</button></div>`;
  });
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

ganchosAba.push(v=>{ if(v==='professor'){ preencherExerciciosProfessor(); $('#prEx').onchange(); } if(v==='academia' || v==='estudo') renderTarefa(); });
renderTarefa();
