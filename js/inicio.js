/* ================== Tela Início ================== */
// O Início é o próprio instrumento: as duas mãos do bandoneon (o mapa de state.layout, o mesmo do Teclado) e o fole
// no meio. Tocar segura a nota como no Teclado (startVoice/stopVoice); trocar o fole (chave ou Espaço) troca o nome
// dos 71 botões em cascata, da esquerda para a direita. Quem chega vê a apresentação e o caminho; quem já praticou
// (classe "volta", posta por renderInicio) vê a próxima etapa, a sequência de dias e o "Praticar hoje".
// Desenho: .impeccable/surfaces/index-html.md (mundo do Doppler, aprovado pelo dono em 2026-11-10).

const ini = {fole:'open', ativos:{}, demo:null};
let iniDemo = true; // primeira impressão: um botão já aparece tocado (some no primeiro toque)
const iniEl = {left:$('#iniMaoEsq'), right:$('#iniMaoDir')};
const iniBotoes = []; // {b, mao, el, span, x}

function iniMontar(){
  iniBotoes.length = 0;
  for(const mao of ['left','right']){
    const area = iniEl[mao]; area.innerHTML = '';
    const lista = state.layout[mao], maxY = Math.max(...lista.map(b=>b.y)), alt = mao==='left' ? 4.29 - .82 : maxY;
    const dy = (alt - maxY) / 2; // a mão esquerda é mais baixa: fica centrada na mesma altura da direita
    for(const b of lista){
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'ini-k';
      el.style.left = b.x + 'em'; el.style.top = (b.y + Math.max(0, dy)) + 'em';
      const span = document.createElement('span'); el.appendChild(span);
      const item = {b, mao, el, span, x: b.x + (mao==='right' ? 9 : 0)};
      el.addEventListener('pointerdown', e=>{ e.preventDefault(); el.setPointerCapture && el.setPointerCapture(e.pointerId); iniTocar(item); });
      for(const ev of ['pointerup','pointercancel','lostpointercapture']) el.addEventListener(ev, ()=>iniSoltar(item));
      el.addEventListener('keydown', e=>{ if((e.key==='Enter' || e.key===' ') && !e.repeat){ e.preventDefault(); e.stopPropagation(); iniTocar(item); } });
      el.addEventListener('keyup', e=>{ if(e.key==='Enter' || e.key===' ') iniSoltar(item); });
      area.appendChild(el); iniBotoes.push(item);
    }
  }
  iniRotular(false);
  iniMostrarDemo();
}
// Nomes dos botões na direção atual do fole; ao trocar, em cascata (sem animação: troca direto)
function iniRotular(animar){
  for(const it of iniBotoes){
    const m = it.b[ini.fole], txt = noteName(m);
    it.el.setAttribute('aria-label', t('{} abrindo, {} fechando', noteName(it.b.open), noteName(it.b.close)));
    if(!animar || movReduzido()){ it.span.textContent = txt; continue; }
    setTimeout(()=>{ it.span.classList.add('sai'); setTimeout(()=>{ it.span.textContent = txt; it.span.classList.remove('sai'); }, 140); }, it.x * 34);
  }
}
function iniTrocaFole(d){
  d = d || (ini.fole==='open' ? 'close' : 'open'); if(d===ini.fole) return;
  // nota segurada: solta e toca a do outro lado, como no instrumento
  const segurados = iniBotoes.filter(it=>ini.ativos[it.mao+it.b.id]);
  segurados.forEach(it=>stopVoice('ini'+it.mao+it.b.id, true));
  ini.fole = d; $('#iniInst').dataset.fole = d;
  $$('#iniInst .ini-chave button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.fole===d));
  segurados.forEach(it=>{ startVoice('ini'+it.mao+it.b.id, it.b[d], it.mao); iniVisor(it); });
  if(ini.demo && !segurados.length) iniVisor(ini.demo);
  iniRotular(true);
}
// O bisonoro sem ler nada: Fá#4 aceso e o visor com as duas notas do botão. Trocar o fole mostra a outra nota;
// o primeiro toque num botão desfaz a encenação.
function iniMostrarDemo(){
  if(!iniDemo) return;
  const it = iniBotoes.find(x=>x.mao==='right' && x.b.open===66 && x.b.close===67) || iniBotoes.find(x=>x.mao==='right' && x.b.open!==x.b.close);
  if(!it) return;
  iniBotoes.forEach(x=>x.el.classList.remove('demo'));
  it.el.classList.add('demo'); ini.demo = it; iniVisor(it);
}
function iniFimDemo(){ iniDemo = false; if(ini.demo) ini.demo.el.classList.remove('demo'); ini.demo = null; }
function iniVisor(it){
  const n = $('#iniNota'); n.classList.remove('vazio'); n.textContent = noteName(it.b[ini.fole]);
  $('#iniAbre').textContent = noteName(it.b.open); $('#iniFecha').textContent = noteName(it.b.close);
}
function iniTocar(it){
  iniFimDemo();
  const k = it.mao + it.b.id; if(ini.ativos[k]) return;
  ini.ativos[k] = true; it.el.classList.add('on');
  startVoice('ini'+k, it.b[ini.fole], it.mao);
  iniVisor(it);
}
function iniSoltar(it){
  const k = it.mao + it.b.id; if(!ini.ativos[k]) return;
  delete ini.ativos[k]; it.el.classList.remove('on'); stopVoice('ini'+k);
}
// Teclado do computador (js/controles.js): com o mapa ligado, as teclas tocam estes botões quando o Início está aberto
const iniKb = {};
for(const mao of ['left','right']) iniKb[mao] = {
  hand: mao,
  tocar: id=>{ const it = iniBotoes.find(x=>x.mao===mao && x.b.id===id); if(it) iniTocar(it); },
  soltar: id=>{ const it = iniBotoes.find(x=>x.mao===mao && x.b.id===id); if(it) iniSoltar(it); },
};
$$('#iniInst .ini-chave button').forEach(b=>b.addEventListener('click', ()=>iniTrocaFole(b.dataset.fole)));
window.addEventListener('blur', ()=>iniBotoes.forEach(iniSoltar));
iniMontar();

/* ---------- O caminho, em quatro partes ---------- */
const INI_PARTES = [
  {t:'Primeiros botões', ids:['conhecer','teclado','bisonoro','microfone','academia','fole']},
  {t:'Ouvido e mapa dos botões', ids:['encontre','ouvido','eco','escala']},
  {t:'Ler música', ids:['teoria-pauta','leitura','teoria-tempo','ritmo','acordes']},
  {t:'Repertório', ids:['melodia','tango','duas','final']},
];
function iniCaminho(es, atual){
  const idx = id => es.findIndex(e=>e.id===id);
  $('#iniCaminhoSub').textContent = t('São {} etapas em quatro partes. O app sempre mostra qual é a próxima, e você segue no seu ritmo.', es.length);
  $('#iniCaminhoLista').innerHTML = INI_PARTES.map(p=>{
    const lista = es.filter(e=>p.ids.includes(e.id)); if(!lista.length) return '';
    return `<div class="ini-parte"><h3>${p.t}</h3><span class="ini-qtd">${lista.length===1 ? '1 etapa' : `${lista.length} etapas`}</span>
      <ol class="ini-etapas">${lista.map(e=>{ const i = idx(e.id), est = (e.feito() ? 'feita' : i===atual ? 'atual' : '') + (e.id==='final' ? ' meta' : '');
        return `<li class="${est}">${e.t}</li>`; }).join('')}</ol></div>`;
  }).join('');
}

/* ---------- Quem volta ---------- */
// es = etapas do aluno, n = feitas, atual = índice da próxima (-1: caminho completo). Chamada por renderTrilha (trilha.js).
function renderInicio(es, n, atual){
  if(!$('#iniInst')) return;
  const voltou = n>0 || Object.keys(state.progress.days||{}).length>0;
  $('#v-inicio').classList.toggle('volta', voltou);
  $('#topoCtaTxt').textContent = voltou ? 'Continuar' : 'Começar';
  iniCaminho(es, atual);
  $('#iniEtapaTxt').textContent = atual<0 ? t('Caminho completo: {} de {} etapas', n, es.length) : t('Etapa {} de {}', atual+1, es.length);
  $('#inContTit').textContent = atual<0 ? 'Caminho completo! A Medalha Doly Costa é sua.' : es[atual].t;
  $('#inContSub').textContent = atual<0 ? '' : es[atual].d;
  $('#inContBtnTxt').textContent = atual<0 ? 'Ver as suas conquistas' : n===0 ? 'Começar' : 'Continuar';
  $('#iniTrilho').innerHTML = es.map((e,i)=>`<i class="${e.feito() ? 'f' : i===atual ? 'a' : ''}"></i>`).join('');
  // a semana, com as iniciais dos dias no idioma da página
  const L = (typeof IDIOMAS!=='undefined' && IDIOMAS[state.lang]) ? IDIOMAS[state.lang].html : 'pt-BR';
  $('#iniSemana').innerHTML = Array.from({length:7}, (_,k)=>{ const d = new Date(); d.setDate(d.getDate()-(6-k));
    const on = !!state.progress.days[dayKey(d)];
    return `<span class="${on ? 'on' : ''} ${k===6 ? 'hoje' : ''}">${d.toLocaleDateString(L, {weekday:'narrow'})}<i></i></span>`; }).join('');
  // Academia: nível em curso e exercícios feitos
  const niveis = ACADEMIA.filter(x=>x.nivel<7), exs = niveis.flatMap(acadFuncionais), fe = exs.filter(e=>acadConcluido(e.id)).length;
  const nv = niveis.find(x=>acadFuncionais(x).some(e=>!acadConcluido(e.id))) || niveis[niveis.length-1];
  $('#inAcadBarra').style.width = (exs.length ? 100*fe/exs.length : 0) + '%';
  $('#inAcadTxt').textContent = t('{} de {} exercícios concluídos', fe, exs.length);
  $('#iniAcadNivel').textContent = t('Nível {}, com o instrutor ao lado.', nv.nivel);
  // RepeTCHÊ do dia: a música, a fase a fazer e o mapa de fases
  const id = ecoDoDia(), mm = ecoMusica(id), fs = ecoFases(id), prox = ecoProximaFase(id);
  $('#inEcoDia').textContent = mm.m.title;
  $('#iniEcoFase').textContent = prox==='tudo' ? 'Desafio final: a música inteira' : t('Fase {} de {}', prox+1, fs.length);
  $('#iniEcoFases').innerHTML = fs.length<2 ? '' : fs.map((_,i)=>{ const f = ecoFaseFeita(id,i), lib = ecoLiberada(id,i);
    return `<span class="${f ? 'f' : i===prox ? 'a' : ''}">${lib ? i+1 : '<svg aria-hidden="true"><use href="#i-lock"/></svg>'}</span>`; }).join('')
    + `<span class="t ${prox==='tudo' ? 'a' : ''}"><svg aria-hidden="true"><use href="#i-trophy"/></svg></span>`;
  // Rotina de hoje
  const feitas = state.progress.days[dayKey()] || {}, falta = ROUTINE.find(r=>!feitas[r.k]);
  $('#iniRotinaTit').textContent = t('{} de {} tarefas', ROUTINE.filter(r=>feitas[r.k]).length, ROUTINE.length);
  $('#iniRotinaTxt').textContent = falta ? t('Próxima: {}.', t(falta.t)) : 'Rotina de hoje completa.';
}
$('#inContBtn').onclick = ()=>$('#heroCta').click();
$('#iniIdiomas').addEventListener('click', e=>{ const b = e.target.closest('[data-lang]'); if(b) irParaIdioma(b.dataset.lang); });
$$('#iniIdiomas [data-lang]').forEach(b=>b.toggleAttribute('aria-current', b.dataset.lang===state.lang));
$('#topoCta').onclick = ()=>$('#heroCta').click(); // o botão verde da barra do topo leva à próxima etapa, de qualquer aba
$('#iniFechoCta').onclick = ()=>$('#heroCta').click();
$('#iniCaminhoCta').onclick = ()=>$('#heroCta').click();
$('#iniEcoJogar').onclick = ()=>{ eco.id = ecoDoDia(); store.set('ecoMusica', eco.id); go('eco'); ecoComecar(); };
$('#iniVerCaminho').onclick = e=>{ e.preventDefault(); $('#iniCaminho').scrollIntoView({behavior: movReduzido() ? 'auto' : 'smooth'}); };
// o mapa dos botões pode mudar em Teclado → Editar layout
ganchosAba.push(nova=>{ if(nova==='inicio'){ iniMontar(); renderTrilha(); } else iniBotoes.forEach(iniSoltar); });
renderTrilha();
