/* ================== Tela Início ================== */
// O Início é o próprio instrumento: as duas mãos do bandoneon (o mapa de state.layout, o mesmo do Teclado) e o fole
// no meio. Tocar segura a nota como no Teclado (startVoice/stopVoice); trocar o fole (chave ou Espaço) troca o nome
// dos 71 botões em cascata, da esquerda para a direita. Quem chega vê a apresentação e o caminho; quem já praticou
// (classe "volta", posta por renderInicio) vê a próxima etapa, a sequência de dias e o "Praticar hoje".
// Desenho: .impeccable/surfaces/index-html.md (mundo do Doppler, aprovado pelo dono em 2026-11-10).

const ini = {fole:'open', ativos:{}, demo:null, ar:.5};
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
  iniGuiaFole();
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
  const n = $('#iniNota'), nome = noteName(it.b[ini.fole]); n.classList.remove('vazio');
  if(n.textContent !== nome){ n.textContent = nome; n.classList.remove('muda'); void n.offsetWidth; n.classList.add('muda'); } // a nota nova sobe
  $('#iniAbre').textContent = noteName(it.b.open); $('#iniFecha').textContent = noteName(it.b.close);
}
function iniTocar(it){
  iniFimDemo(); iniGuiaToque(it);
  const k = it.mao + it.b.id; if(ini.ativos[k]) return;
  ini.ativos[k] = true; it.el.classList.add('on');
  startVoice('ini'+k, it.b[ini.fole], it.mao);
  iniVisor(it);
  anelToque(it.el); vibrar('toque'); iniRespirar(); iniPautaNota(it.b[ini.fole]); auroraViva($('#v-inicio .ini-palco'));
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

/* ---------- O fole respira: enquanto há nota soando, as pregas abrem (fole abrindo) ou fecham (fechando) ---------- */
let iniArRaf = 0, iniArT = 0;
function iniRespirar(){
  if(iniArRaf || movReduzido()) return;
  iniArT = performance.now();
  const passo = agora=>{
    const n = Object.keys(ini.ativos).length + (iniTrecho.tocando ? 1 : 0), dt = Math.min(.05, (agora - iniArT) / 1000); iniArT = agora;
    if(!n){ iniArRaf = 0; return; }
    ini.ar = Math.max(0, Math.min(1, ini.ar + (ini.fole==='open' ? 1 : -1) * dt * .16 * Math.min(3, n)));
    $('#iniInst').style.setProperty('--ar', ini.ar.toFixed(3));
    iniArRaf = requestAnimationFrame(passo);
  };
  iniArRaf = requestAnimationFrame(passo);
}

/* ---------- Partitura viva: as últimas notas tocadas, na clave de sol (Dó4 para cima) ou na de fá ---------- */
const iniNotas = [], INI_PAUTA_MAX = 8;
function iniPautaNota(midi){
  iniNotas.push(midi); if(iniNotas.length > INI_PAUTA_MAX) iniNotas.shift();
  $('#iniPautaDica').hidden = true; iniPautaRender(true);
}
function iniPautaRender(nova){
  if(typeof pautaSVG !== 'function') return; // teoria.js carrega depois; o primeiro desenho vem no DOMContentLoaded
  const n = iniNotas.length, W = 540, x = i => 104 + i * 54;
  const nota = (m, i) => ({...dDoMidi(m), x:x(i), semHaste:true, cls:(i === n-1 ? 'ultima' : '') + (nova && i === n-1 ? ' entra' : '')});
  const sol = iniNotas.map((m, i)=>m >= 60 ? nota(m, i) : null).filter(Boolean), fa = iniNotas.map((m, i)=>m < 60 ? nota(m, i) : null).filter(Boolean);
  $('#iniPauta').innerHTML = pautaSVG('sol', sol, W) + pautaSVG('fa', fa, W);
  $('#iniPauta').setAttribute('aria-label', n ? t('Notas tocadas: {}', iniNotas.map(noteName).join(', ')) : t('As notas que você tocou, na partitura'));
}
document.addEventListener('DOMContentLoaded', ()=>iniPautaRender(false));

/* ---------- Ouvir um trecho de tango: a introdução de El Choclo (Villoldo, 1903, domínio público) no instrumento ---------- */
const iniTrecho = {tocando:false, timers:[]};
function iniPararTrecho(){
  iniTrecho.timers.forEach(clearTimeout); iniTrecho.timers = []; iniTrecho.tocando = false;
  iniBotoes.forEach(x=>{ if(!ini.ativos[x.mao + x.b.id]) x.el.classList.remove('on'); });
  const b = $('#iniTrechoBtn'); b.textContent = t('Ouvir um trecho de tango'); botaoRodando(b, false);
}
$('#iniTrechoBtn').onclick = ()=>{
  if(iniTrecho.tocando){ iniPararTrecho(); return; }
  ac(); carregarSons(); iniFimDemo();
  const m = parseMelody(melodiaPronta('choclo-intro')); buildTimeline(m); fingerMelody(m);
  const notas = m.notes.filter(n=>!n.rest && n.btn), fimFrase = notas.findIndex(n=>n.beats >= 1); // a primeira frase, até a nota longa
  const frase = notas.slice(0, fimFrase >= 0 ? fimFrase + 1 : 13), spb = 60 / (m.bpm || 72), t0 = AC.currentTime + .15, inicio = frase[0].t;
  iniTrecho.tocando = true; const b = $('#iniTrechoBtn'); b.textContent = t('Parar'); botaoRodando(b, true);
  frase.forEach(n=>{
    const quando = (n.t - inicio) * spb;
    playNote(n.midi, n.beats * spb * .9, n.hand, t0 + quando);
    iniTrecho.timers.push(setTimeout(()=>{
      if(n.dir && n.dir !== ini.fole) iniTrocaFole(n.dir);
      const it = iniBotoes.find(x=>x.mao === n.hand && x.b.id === n.btn.id); if(!it) return;
      it.el.classList.add('on'); anelToque(it.el); iniVisor(it); iniPautaNota(n.midi); iniRespirar(); auroraViva($('#v-inicio .ini-palco'));
      iniTrecho.timers.push(setTimeout(()=>{ if(!ini.ativos[it.mao + it.b.id]) it.el.classList.remove('on'); }, n.beats * spb * 850));
    }, 150 + quando * 1000));
  });
  const fim = Math.max(...frase.map(n=>n.t - inicio + n.beats));
  iniTrecho.timers.push(setTimeout(()=>{ iniPararTrecho(); avisar(`<span>${t('Esse foi o começo de El Choclo, de 1903. Quer tocar? Experimente o RepeTCHÊ: o bandoneon toca e você repete.')}</span>`); }, 400 + fim * spb * 1000));
};
ganchosAba.push(v=>{ if(v !== 'inicio' && iniTrecho.tocando) iniPararTrecho(); });

/* ---------- Minuto guiado: o bisonoro em três passos (primeira visita) ----------
   1. toque o botão aceso → 2. troque o fole e toque o mesmo botão → 3. "nota diferente!" e o convite para a lição 1.
   Segurar o botão e trocar o fole também conta. Feito ou pulado, não aparece mais (store 'guiaInicio'). */
const guia = {passo:0, alvo:null, fole:null};
function iniGuiaMostrar(){
  if(store.get('guiaInicio', false) || !ini.demo){ $('#iniGuia').hidden = true; return; }
  guia.alvo = ini.demo; guia.passo = 1; iniGuiaRender();
}
function iniGuiaRender(){
  const box = $('#iniGuia'); box.hidden = !guia.passo;
  if(!guia.passo) return;
  $$('#iniGuia .ini-guia-pontos li').forEach((li, i)=>{ li.classList.toggle('feito', i < guia.passo - 1); li.classList.toggle('atual', i === guia.passo - 1); });
  iniBotoes.forEach(x=>x.el.classList.remove('guia'));
  if(guia.passo < 3 && guia.alvo) guia.alvo.el.classList.add('guia');
  const dir = d => d==='open' ? t('abrindo') : t('fechando'), b = guia.alvo.b;
  const [forte, resto] = guia.passo === 1 ? [t('Toque o botão aceso.'), t('Ele fica na mão direita. Ouça a nota.')]
    : guia.passo === 2 ? [t('Agora troque o fole e toque o mesmo botão.'), t('Use a chave {} ou a tecla Espaço.', ini.fole==='open' ? t('Fechando') : t('Abrindo'))]
    : [t('Nota diferente!'), t('O mesmo botão deu {} {} e {} {}. Cada botão dá duas notas: uma abrindo o fole, outra fechando. Isso é o bisonoro.',
        noteName(b.open), dir('open'), noteName(b.close), dir('close'))];
  $('#iniGuiaTxt').innerHTML = `<b>${escHtml(forte)}</b> ${escHtml(resto)}`;
  $('#iniGuiaAcoes').innerHTML = guia.passo === 3
    ? `<button type="button" class="btn" id="iniGuiaLicao">${t('Começar a primeira lição')}<svg aria-hidden="true"><use href="#i-arrow"/></svg></button><button type="button" class="btn-fantasma" id="iniGuiaLivre">${t('Tocar à vontade')}</button>` : '';
  $('#iniGuiaPular').hidden = guia.passo === 3;
  if(guia.passo === 3){ $('#iniGuiaLicao').onclick = ()=>{ iniGuiaFim(); $('#heroCta').click(); }; $('#iniGuiaLivre').onclick = iniGuiaFim; }
}
function iniGuiaToque(it){
  if(!guia.passo || guia.passo === 3 || it !== guia.alvo) return;
  if(guia.passo === 1){ guia.fole = ini.fole; guia.passo = 2; }
  else if(ini.fole !== guia.fole) iniGuiaConcluir();
  iniGuiaRender();
}
function iniGuiaFole(){ // segurando o botão aceso e trocando o fole também vale
  if(guia.passo === 2 && guia.alvo && ini.fole !== guia.fole && ini.ativos[guia.alvo.mao + guia.alvo.b.id]){ iniGuiaConcluir(); iniGuiaRender(); }
  else if(guia.passo === 2) iniGuiaRender();
}
function iniGuiaConcluir(){ guia.passo = 3; store.set('guiaInicio', true); contarUso('guia-inicio'); vibrar && vibrar(30); }
function iniGuiaFim(){ guia.passo = 0; store.set('guiaInicio', true); iniBotoes.forEach(x=>x.el.classList.remove('guia')); iniGuiaRender(); }
$('#iniGuiaPular').onclick = iniGuiaFim;
iniGuiaMostrar();

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
