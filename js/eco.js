/* ================== RepeTCHÊ: o bandoneon toca, você repete ================== */
// Jogo de memória musical, aba Treinar → RepeTCHÊ (no código, "eco"). Tocar numa música começa o jogo.
// A cada sequência certa o gaúcho animado (vídeo em imagens/repetche/) sobe pelo canto e diz "Muy bueno!".
// O app toca o começo de uma música e o aluno repete; a cada
// rodada entram mais notas (2 por padrão). Decorar a música inteira é demais: cada música é dividida em
// FASES curtas (8 notas). Um jogo é uma fase; completar uma libera a seguinte, e completar todas libera o
// desafio final, a música inteira (aí em trechos de 4 rodadas). As músicas são as das Melodias que
// estão em domínio público, e as notas, os botões e a direção do fole vêm do mesmo motor (fingerMelody).
// O fole troca de direção sozinho: o desafio é o ouvido, a memória e o mapa dos botões.
// Pontos: 10 por nota certa × combo (sobe a cada 8 acertos seguidos, até ×4) + bônus de rodada perfeita.
// Estrelas no fim: 3 sem erro, 2 com até 3 erros, 1 se chegou ao fim. Errar não acaba o jogo: o app
// mostra o botão certo e espera.
const ECO_MUSICAS = [
  {id:'estrelinha', dif:1}, {id:'esc-do', dif:1}, {id:'ode', dif:1}, {id:'esq-do', dif:2}, {id:'arpejos', dif:2},
  {id:'esc-sol', dif:2}, {id:'esc-lam', dif:2}, {id:'esq-baixos', dif:2}, {id:'cromatica', dif:3}, {id:'cumparsita', dif:2}, {id:'choclo-intro', dif:3}, {id:'tico-tico', dif:3},
];
state.progress.eco = state.progress.eco || {}; // {id: {pts, estrelas, fases:{0:{pts,estrelas}}}}: pts/estrelas são da música inteira
state.progress.ecoDias = state.progress.ecoDias || {}; // dias em que a música do dia foi feita: {'2026-11-07': true}
const eco = {id:ECO_MUSICAS[0].id, faseN:0, nFases:1, m:null, seq:[], k:2, ajuda:'ver', vel:1, ini:0, fimT:0, alvo:0, pos:0, rodada:0, rodadas:0,
             fase:'', pontos:0, mostrados:0, combo:0, maxCombo:0, erros:0, errosRodada:0, timers:[], dir:'open', hand:'right'};
const ecoCache = {};
// De onde vem cada música: as prontas (domínio público), as que o aluno digitou em Melodias e as partituras que
// importou na Academia (essas duas ficam só no aparelho dele: uso pessoal).
function ecoFonte(id){
  const b = BUILTIN_MELODIES.find(x=>x.id===id); if(b) return {texto:b.text};
  const u = customMelodies().find(x=>x.id===id); if(u) return {texto:u.text, sua:true};
  const p = minhasPartituras().find(x=>x.id===id); if(p) return {texto:p.texto, titulo:p.titulo, sua:true};
  return null;
}
const ecoSuas = () => customMelodies().map(x=>x.id).concat(minhasPartituras().map(p=>p.id));
// Notas da música, uma por "momento", já com fole e botão. Música a duas mãos: o jogo usa a mão com mais notas
// (em geral a melodia, na direita).
function ecoMusica(id){
  if(ecoCache[id]) return ecoCache[id];
  const f = ecoFonte(id); if(!f) return null;
  const m = parseMelody(f.texto); m.id = id; if(f.titulo && m.title==='Sem título') m.title = f.titulo;
  buildTimeline(m); fingerMelody(m);
  let seq = m.groups.filter(g=>!g.rest && g.dir).map(g=>g.idxs.map(i=>m.notes[i]).find(n=>!n.rest && !n.error)).filter(Boolean)
    .map(n=>({midi:n.midi, dir:n.dir, btn:n.btn, hand:n.hand, beats:n.beats}));
  const naDireita = seq.filter(n=>n.hand==='right').length, mao = naDireita >= seq.length - naDireita ? 'right' : 'left';
  seq = seq.filter(n=>n.hand===mao);
  return ecoCache[id] = {m, seq, mao, sua:!!f.sua};
}
// Música do dia: a mesma para todo mundo no mesmo dia (sorteada pela data). Fazer em dias seguidos aumenta a sequência.
function ecoDoDia(d = new Date()){ const k = dayKey(d); let h = 7; for(const c of k) h = (h*31 + c.charCodeAt(0)) >>> 0; return ECO_MUSICAS[h % ECO_MUSICAS.length].id; }
function ecoSequenciaDias(){
  let n = 0; const d = new Date(); if(!state.progress.ecoDias[dayKey(d)]) d.setDate(d.getDate()-1); // ainda dá tempo hoje
  while(state.progress.ecoDias[dayKey(d)]){ n++; d.setDate(d.getDate()-1); }
  return n;
}
// Fases: pedaços de 8 notas (o resto pequeno do fim entra na última). 'tudo' = a música inteira.
const ECO_FASE = 8;
function ecoFases(id){
  const N = ecoMusica(id).seq.length, f = [];
  for(let a=0; a<N;){ let b = Math.min(N, a+ECO_FASE); if(N-b<4) b = N; f.push([a,b]); a = b; }
  return f;
}
const ecoProg = id => state.progress.eco[id] || {};
const ecoFaseFeita = (id, i) => { const p = ecoProg(id); return (p.fases && p.fases[i]) || null; };
// liberada: a primeira, a seguinte a uma fase feita, ou todas para quem já completou a música inteira
const ecoLiberada = (id, i) => i===0 || !!ecoProg(id).estrelas || !!ecoFaseFeita(id, i-1);
const ecoTodasFeitas = id => ecoFases(id).every((_,i)=>ecoFaseFeita(id,i));
const ecoTudoLiberado = id => !!ecoProg(id).estrelas || ecoTodasFeitas(id);
// o que jogar ao tocar na música: a primeira fase ainda não feita; com todas feitas, a música inteira
function ecoProximaFase(id){ const fs = ecoFases(id), i = fs.findIndex((_,k)=>!ecoFaseFeita(id,k)); return i>=0 ? i : fs.length>1 ? 'tudo' : 0; }
const ecoTrecho = () => eco.k*4; // notas por trecho (na música inteira)
const ecoOpts = {getDir:()=>eco.dir, perRow:1, onPress:(b,m,dir,k)=>ecoPress(b,m,k)};
const ecoL = kb($('#ecoKbL'),'left',ecoOpts), ecoR = kb($('#ecoKbR'),'right',ecoOpts);
const ecoKb = () => eco.hand==='left' ? ecoL : ecoR;
const ecoTimer = (f, ms) => eco.timers.push(setTimeout(f, ms));

/* ---------- Escolher a música ---------- */
function ecoEstrelas(n, total=3){
  return Array.from({length:total}, (_,i)=>`<svg class="${i<n?'on':''}" aria-hidden="true"><use href="#i-star"/></svg>`).join('');
}
function ecoCartao(id, i, dif){
  const {m, seq, mao} = ecoMusica(id), r = state.progress.eco[id], fs = ecoFases(id);
  if(fs.length>1){ // em fases: um segmento por fase e qual é a próxima
    const prox = ecoProximaFase(id), feitas = fs.filter((_,k)=>ecoFaseFeita(id,k)).length;
    return `<button type="button" class="eco-musica ${id===eco.id?'on':''}" data-id="${id}" style="--i:${i}">
    <span class="eco-jogar" aria-hidden="true"><svg><use href="#i-play"/></svg></span>
    ${dif ? `<span class="eco-dif" data-dif="${dif}" aria-label="Dificuldade ${dif} de 3"><i></i><i></i><i></i></span>` : '<span class="eco-sua">Sua</span>'}
    <b>${m.title}</b><small class="muted">${fs.length} fases · ${mao==='left'?'mão esquerda':'mão direita'}</small>
    <span class="eco-segs" aria-label="${feitas} de ${fs.length} fases feitas">${fs.map((_,k)=>{ const f = ecoFaseFeita(id,k); return `<i class="${f ? 'e'+f.estrelas : ''}"></i>`; }).join('')}</span>
    ${prox==='tudo' ? (r && r.estrelas ? `<small class="eco-rec">Completa · ${r.pts}</small>` : '<small class="eco-rec">Desafio final</small>')
      : feitas || (r && r.estrelas) ? `<small class="eco-rec">Fase ${prox+1} de ${fs.length}</small>` : '<small class="eco-rec novo">Nova</small>'}
  </button>`;
  }
  return `<button type="button" class="eco-musica ${id===eco.id?'on':''}" data-id="${id}" style="--i:${i}">
    <span class="eco-jogar" aria-hidden="true"><svg><use href="#i-play"/></svg></span>
    ${dif ? `<span class="eco-dif" data-dif="${dif}" aria-label="Dificuldade ${dif} de 3"><i></i><i></i><i></i></span>` : '<span class="eco-sua">Sua</span>'}
    <b>${m.title}</b><small class="muted">${seq.length} notas · ${mao==='left'?'mão esquerda':'mão direita'}</small>
    <span class="eco-mini-estrelas" aria-label="${r ? r.estrelas : 0} de 3 estrelas">${ecoEstrelas(r ? r.estrelas : 0)}</span>
    ${r ? `<small class="eco-rec">Recorde: ${r.pts}</small>` : '<small class="eco-rec novo">Nova</small>'}
  </button>`;
}
function renderEcoMusicas(){
  $('#ecoMusicas').innerHTML = ECO_MUSICAS.map((x,i)=>ecoCartao(x.id, i, x.dif)).join('');
  const suas = ecoSuas().filter(id=>{ const mm = ecoMusica(id); return mm && mm.seq.length>=4; });
  $('#ecoSuas').innerHTML = suas.map((id,i)=>ecoCartao(id, i, 0)).join('');
  $('#ecoSuasVazio').hidden = suas.length>0;
  renderEcoDia();
}
function renderEcoDia(){
  const id = ecoDoDia(), mm = ecoMusica(id), feita = !!state.progress.ecoDias[dayKey()], seq = ecoSequenciaDias();
  const el = $('#ecoDia'); el.classList.toggle('feita', feita);
  el.innerHTML = `<div class="eco-dia-txt"><span class="eco-dia-kicker">Música do dia</span><b>${mm.m.title}</b>`
    + `<small class="muted">${feita ? t('Feita hoje! Amanhã tem outra.') : t('Uma fase por dia. Complete para manter a sequência.')}</small></div>`
    + `<div class="eco-dia-seq ${seq ? 'on' : ''}" aria-label="${t('Sequência de {} dia(s)', seq)}"><svg aria-hidden="true"><use href="#i-flame"/></svg><b>${seq}</b><small>${seq===1 ? t('dia') : t('dias')}</small></div>`
    + `<button type="button" class="btn ${feita ? 'sec' : ''}" data-id="${id}"><svg aria-hidden="true"><use href="#i-play"/></svg>${feita ? t('Jogar de novo') : t('Jogar')}</button>`;
}
// tocar numa música (da lista, das suas ou a do dia) já começa
$('#ecoEscolha').addEventListener('click', e=>{
  const b = e.target.closest('[data-id]'); if(!b) return;
  eco.id = b.dataset.id; store.set('ecoMusica', eco.id);
  $$('#ecoEscolha .eco-musica').forEach(x=>x.classList.toggle('on', x.dataset.id===eco.id));
  ecoComecar();
});
// Mapa de fases (no jogo e na tela do fim): número e estrelas das feitas, cadeado nas trancadas, troféu = música inteira
function ecoMapa(){
  const id = eco.id, fs = ecoFases(id);
  const html = fs.length<2 ? '' : fs.map((_,i)=>{
    const r = ecoFaseFeita(id,i), lib = ecoLiberada(id,i);
    return `<button type="button" class="eco-fase ${r?'feita':''} ${i===eco.faseN?'atual':''}" data-fase="${i}" ${lib?'':'disabled'} aria-label="Fase ${i+1}">`
      + `<b>${lib ? i+1 : '<svg aria-hidden="true"><use href="#i-lock"/></svg>'}</b><span class="eco-fase-est">${ecoEstrelas(r ? r.estrelas : 0)}</span></button>`;
  }).join('') + `<button type="button" class="eco-fase final ${ecoProg(id).estrelas?'feita':''} ${eco.faseN==='tudo'?'atual':''}" data-fase="tudo" ${ecoTudoLiberado(id)?'':'disabled'} aria-label="Música inteira">`
      + `<b><svg aria-hidden="true"><use href="#i-trophy"/></svg></b><span class="eco-fase-est">${ecoEstrelas(ecoProg(id).estrelas || 0)}</span></button>`;
  $$('.eco-mapa').forEach(el=>{ el.innerHTML = html; el.hidden = !html;
    const a = el.querySelector('.atual'); if(a) el.scrollLeft = a.offsetLeft - el.clientWidth/2 + a.offsetWidth/2; });
}
$('#v-eco').addEventListener('click', e=>{
  const b = e.target.closest('.eco-fase'); if(!b || b.disabled) return;
  ecoComecar(b.dataset.fase==='tudo' ? 'tudo' : +b.dataset.fase);
});
['ecoAjuda','ecoPasso','ecoVel'].forEach(id=>{ const v = store.get(id, null); if(v!=null && $('#'+id)) $('#'+id).value = v;
  $('#'+id).addEventListener('change', e=>store.set(id, e.target.value)); });
{ const salvo = store.get('ecoMusica', null); if(salvo && ecoFonte(salvo)) eco.id = salvo; }

/* ---------- Partes da tela que mudam durante o jogo ---------- */
// Faixa do topo: "Ouça…", "Sua vez!", "Perfeito!". Remove e põe a classe de novo para reiniciar a animação.
function ecoFaixa(txt, tipo, sub=''){
  const f = $('#ecoFaixa'); f.className = 'eco-faixa'; void f.offsetWidth; f.classList.add(tipo);
  $('#ecoFaixaTxt').textContent = txt; $('#ecoFaixaSub').textContent = sub;
}
function ecoDirPill(){
  const p = $('#ecoDir'), escondido = eco.ajuda==='ouvido' && eco.fase==='ouvir';
  p.className = 'dirpill ' + eco.dir; p.textContent = escondido ? '?' : dirLabel(eco.dir);
  ecoKb().refresh(); ecoKb().retune();
}
// pontos contam até o valor novo (sem animação: o valor aparece direto)
function ecoPlacar(){
  const el = $('#ecoPontos'), de = eco.mostrados, ate = eco.pontos; eco.mostrados = ate;
  el.classList.remove('sobe'); void el.offsetWidth; el.classList.add('sobe');
  if(movReduzido() || ate-de<=0){ el.textContent = ate; return; }
  const t0 = performance.now();
  const passo = agora=>{ const k = Math.min(1,(agora-t0)/450); el.textContent = Math.round(de+(ate-de)*(1-Math.pow(1-k,3)));
    if(k<1 && eco.mostrados===ate) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
const ecoMult = () => Math.min(4, 1 + Math.floor(eco.combo/8));
function ecoHud(){
  $('#ecoRodada').textContent = eco.rodada; $('#ecoRodadas').textContent = eco.rodadas;
  const c = $('#ecoCombo'), mult = ecoMult();
  $('#ecoComboN').textContent = '×' + mult; c.classList.toggle('quente', mult>1); c.dataset.mult = mult;
  $('#ecoSeq').textContent = eco.combo;
  $('#ecoBarra').style.width = (100*eco.alvo/eco.seq.length) + '%';
}
// A trilha: um ponto por nota da música. Os do trecho atual brilham; os novos da rodada entram "pulando".
function ecoTrilha(novosDe){
  const ps = $$('#ecoTrilha i');
  ps.forEach((p,i)=>{
    p.className = i<eco.ini ? 'feito' : i<eco.alvo ? 'rodada' : i<eco.fimT ? 'trecho' : '';
    if(novosDe!=null && i>=novosDe && i<eco.alvo){ p.classList.add('novo'); p.style.setProperty('--d', (i-novosDe)*90+'ms'); }
  });
  ecoAtual();
}
function ecoAtual(){
  $$('#ecoTrilha i.atual').forEach(p=>p.classList.remove('atual'));
  if(eco.fase==='vez' && eco.pos<eco.alvo) $$('#ecoTrilha i')[eco.pos].classList.add('atual');
}
function ecoPonto(i, cls){ const p = $$('#ecoTrilha i')[i]; if(!p) return; p.classList.remove('soa','ok','erro'); void p.offsetWidth; p.classList.add(cls); }
// "+20" que sobe do botão tocado
function ecoFlutua(k, b, txt, cls){
  if(movReduzido()) return;
  const s = k.size || 40, f = document.createElement('span');
  f.className = 'eco-flutua ' + cls; f.textContent = txt;
  f.style.left = (8 + b.x*s + s*0.4) + 'px'; f.style.top = (8 + b.y*s) + 'px';
  k.el.appendChild(f); setTimeout(()=>f.remove(), 900);
}
// Faíscas saindo da faixa (rodada perfeita)
function ecoFaiscas(){
  if(movReduzido()) return;
  const f = $('#ecoFaixa');
  for(let i=0;i<12;i++){
    const s = document.createElement('i'); s.className = 'eco-faisca';
    s.style.setProperty('--a', (i*30 + Math.random()*14) + 'deg'); s.style.setProperty('--r', (70 + Math.random()*60) + 'px');
    f.appendChild(s); setTimeout(()=>s.remove(), 900);
  }
}
// O gaúcho sobe pelo canto, toca balançando e diz "Muy bueno!"; desce sozinho (sem animação: só aparece e some)
let ecoGauchoTimer = 0;
// Os vídeos do gaúcho: o curto (1,2 s, só o "Muy bueno!") a cada sequência certa e o do começo até a fala (3,5 s)
// na tela do fim. Só são baixados quando o jogo começa. "Voz do gaúcho" desligada: o vídeo toca sem som.
// Sem animação (Animações: Reduzidas) ele aparece parado, no primeiro quadro.
const ecoVid = $('#ecoGauchoVid'), ecoFimVid = $('#ecoFimVid');
const ecoVozLigada = () => $('#ecoVozOn').checked;
function ecoPrepararGaucho(){
  if(ecoVid.getAttribute('src')) return;
  const pasta = RAIZ + 'imagens/repetche/';
  ecoVid.poster = pasta + 'gaucho-muy-bueno.jpg'; ecoVid.src = pasta + 'gaucho-muy-bueno.mp4'; ecoVid.preload = 'auto';
  ecoFimVid.poster = pasta + 'gaucho-fim.jpg'; ecoFimVid.src = pasta + 'gaucho-fim.mp4'; ecoFimVid.preload = 'auto';
}
function ecoTocarVideo(v){
  ecoPrepararGaucho(); v.muted = !ecoVozLigada(); v.volume = Math.min(1, state.volume/100);
  try{ v.currentTime = 0; }catch(e){}
  if(movReduzido()){ v.pause(); return; }
  // fora de um toque (ex.: a tela do fim) o celular pode bloquear o som: aí toca sem som
  try{ const p = v.play(); if(p && p.catch) p.catch(()=>{ v.muted = true; const q = v.play(); if(q && q.catch) q.catch(()=>{}); }); }catch(e){}
}
$('#ecoVozOn').checked = store.get('ecoVoz', true);
$('#ecoVozOn').addEventListener('change', e=>{ store.set('ecoVoz', e.target.checked); if(e.target.checked) ecoTocarVideo(ecoVid); }); // ligou: ouve como fica
function ecoGaucho(){
  ecoTocarVideo(ecoVid);
  const g = $('#ecoGaucho'); g.classList.remove('aparece'); void g.offsetWidth; g.classList.add('aparece');
  clearTimeout(ecoGauchoTimer); ecoGauchoTimer = setTimeout(()=>g.classList.remove('aparece'), 1800);
}
function ecoFeed(msg, cls=''){ const f = $('#ecoFeed'); f.className = 'feedback ' + cls; f.textContent = msg; }

/* ---------- O jogo ---------- */
function ecoLimpar(){ eco.timers.forEach(clearTimeout); eco.timers = []; ecoL.clearMarks(); ecoR.clearMarks(); }
// f = número da fase (0, 1, …) ou 'tudo'; sem f, a próxima fase a fazer dessa música
function ecoComecar(f){
  ac(); ecoLimpar(); ecoPrepararGaucho();
  if(!ecoMusica(eco.id)) eco.id = ECO_MUSICAS[0].id; // a música salva foi apagada
  const {m, seq:toda} = ecoMusica(eco.id), fs = ecoFases(eco.id);
  if(f!=='tudo' && !(Number.isInteger(f) && fs[f])) f = ecoProximaFase(eco.id);
  if(fs.length<2) f = 0;
  const seq = f==='tudo' ? toda : toda.slice(fs[f][0], fs[f][1]);
  eco.faseN = f; eco.nFases = fs.length;
  Object.assign(eco, {m, seq, k:+$('#ecoPasso').value, ajuda:$('#ecoAjuda').value, vel:+$('#ecoVel').value, hand:ecoMusica(eco.id).mao,
    ini:0, alvo:0, pos:0, rodada:0, pontos:0, mostrados:0, combo:0, maxCombo:0, erros:0, errosRodada:0, fase:'contagem'});
  eco.fimT = ecoFimTrecho(0);
  // total de rodadas: ceil(tamanho do trecho / notas por rodada), trecho a trecho
  eco.rodadas = 0; for(let a=0; a<seq.length; a=ecoFimTrecho(a)) eco.rodadas += Math.ceil((ecoFimTrecho(a)-a)/eco.k);
  $('#ecoEscolha').hidden = true; $('#ecoFimCard').hidden = true; $('#ecoJogo').hidden = false;
  $('#ecoKbL').hidden = eco.hand!=='left'; $('#ecoKbR').hidden = eco.hand!=='right';
  ecoKb().build();
  $('#ecoMusicaTit').textContent = m.title;
  $('#ecoFaseTit').hidden = fs.length<2;
  $('#ecoFaseTit').textContent = f==='tudo' ? 'Música inteira' : `Fase ${f+1} de ${fs.length}`;
  ecoMapa();
  $('#ecoTrilha').innerHTML = seq.map(()=>'<i></i>').join('');
  $('#ecoPontos').textContent = '0'; eco.dir = seq[0].dir; ecoDirPill(); ecoHud(); ecoTrilha(); ecoFeed('');
  $('#ecoJogo').scrollIntoView({block:'start', behavior: movReduzido()?'auto':'smooth'});
  // contagem 3, 2, 1
  [3,2,1].forEach((n,i)=>ecoTimer(()=>ecoFaixa(String(n), 'conta'), i*520));
  ecoTimer(ecoRodada, 3*520);
}
// fim do trecho que começa em a (o resto pequeno no fim entra no último trecho)
function ecoFimTrecho(a){ const N = eco.seq.length, f = Math.min(N, a + ecoTrecho()); return N - f < eco.k ? N : f; }
function ecoRodada(){
  const antes = eco.alvo;
  eco.rodada++; eco.alvo = Math.min(eco.alvo + eco.k, eco.fimT); eco.pos = eco.ini; eco.errosRodada = 0;
  ecoHud(); ecoTrilha(antes);
  ecoFaixa(`Rodada ${eco.rodada}`, 'rodada', `+${eco.alvo-antes} notas`);
  ecoTimer(ecoOuvir, movReduzido() ? 500 : 950);
}
// O bandoneon toca o trecho do começo até a nota nova
function ecoOuvir(){
  ecoLimpar(); eco.fase = 'ouvir'; ecoAtual(); ecoFaixa('Ouça…', 'ouvir'); $('#ecoRepetir').disabled = true;
  const spb = 60/(eco.m.bpm*eco.vel); let t = 350;
  for(let i=eco.ini; i<eco.alvo; i++){
    const n = eco.seq[i], dur = Math.min(1.1, Math.max(0.3, n.beats*spb));
    ecoTimer(()=>{
      eco.dir = n.dir; ecoDirPill(); ecoPonto(i, 'soa');
      playNote(n.midi, dur*0.92, n.hand);
      if(eco.ajuda==='ver') ecoKb().mark(n.btn.id, 'down', dur*850);
    }, t);
    t += dur*1000;
  }
  ecoTimer(ecoSuaVez, t + 200);
}
function ecoSuaVez(){
  eco.fase = 'vez'; eco.pos = eco.ini; eco.dir = eco.seq[eco.pos].dir; ecoDirPill(); ecoAtual();
  ecoFaixa('Sua vez!', 'vez', `${eco.alvo-eco.ini} notas`); $('#ecoRepetir').disabled = false;
}
function ecoPress(b, m, k){
  if(eco.fase!=='vez' || k!==ecoKb()) return;
  if(m===eco.seq[eco.pos].midi) ecoAcerto(b); else ecoErro(b, m);
}
// Bandoneon de verdade: o microfone (js/microfone.js) ouve a nota. Só vale na sua vez: o som que o app toca
// na fase "Ouça" não conta como resposta. O bandoneon soa em oitavas, então a oitava de cima também vale.
function ecoMicNota(m){
  if(eco.fase!=='vez') return;
  const n = eco.seq[eco.pos];
  if(micMatches(m, n.midi)) ecoAcerto(n.btn); else ecoErro(null, m);
}
let ecoMicDono = false; // o microfone foi ligado aqui (e desliga ao sair da aba)
$('#ecoMicOn').addEventListener('change', async e=>{
  if(e.target.checked){ if(!mic.on){ if(await micStart()) ecoMicDono = true; else e.target.checked = false; } }
  else if(mic.on){ micStop(); ecoMicDono = false; }
});
// acerto (b = botão da nota certa) e erro (b = botão tocado; sem botão quando veio do microfone)
function ecoAcerto(b){
  const k = ecoKb();
  k.mark(b.id, 'ok', 450);
  eco.combo++; eco.maxCombo = Math.max(eco.maxCombo, eco.combo);
  const mult = ecoMult(), pts = 10*mult; eco.pontos += pts;
  ecoFlutua(k, b, '+'+pts, mult>1 ? 'combo' : ''); ecoPonto(eco.pos, 'ok');
  if(eco.combo>1 && eco.combo%8===0){ const c = $('#ecoCombo'); c.classList.remove('estoura'); void c.offsetWidth; c.classList.add('estoura'); }
  eco.pos++; ecoPlacar(); ecoHud(); ecoFeed('');
  if(eco.pos>=eco.alvo){ ecoRodadaFeita(); return; }
  eco.dir = eco.seq[eco.pos].dir; ecoDirPill(); ecoAtual();
}
function ecoErro(b, m){
  const k = ecoKb(), n = eco.seq[eco.pos];
  if(b){ k.mark(b.id, 'bad', 500); ecoFlutua(k, b, '✕', 'erro'); }
  k.mark(n.btn.id, 'hint', 1800);
  eco.erros++; eco.errosRodada++; eco.combo = 0; ecoHud();
  ecoPonto(eco.pos, 'erro');
  const tr = $('#ecoTrilha'); tr.classList.remove('treme'); void tr.offsetWidth; tr.classList.add('treme');
  ecoFeed(`Esse é ${noteName(m)}. A nota era ${noteName(n.midi)}: o botão certo está brilhando.`, 'bad');
}
function ecoRodadaFeita(){
  eco.fase = 'entre'; ecoAtual(); $('#ecoRepetir').disabled = true;
  const perfeita = eco.errosRodada===0, bonus = perfeita ? 20 + 5*(eco.alvo-eco.ini) : 0;
  if(bonus){ eco.pontos += bonus; ecoPlacar(); }
  const fimTrecho = eco.alvo>=eco.fimT, fimMusica = eco.alvo>=eco.seq.length;
  ecoFaixa(perfeita ? 'Perfeito!' : 'Muito bem!', perfeita ? 'perfeito' : 'bem',
           (bonus ? `+${bonus} pontos` : '') + (fimTrecho && !fimMusica ? (bonus ? ' · ' : '') + 'Trecho completo!' : ''));
  if(perfeita) ecoFaiscas();
  vibrar('ok'); ecoGaucho();
  if(fimMusica){ ecoTimer(ecoFim, 1300); return; }
  if(fimTrecho){ eco.ini = eco.alvo; eco.fimT = ecoFimTrecho(eco.ini); }
  ecoTimer(ecoRodada, 1800); // dá tempo do gaúcho aparecer e descer
}
function ecoFim(){
  ecoLimpar(); eco.fase = 'fim';
  const estrelas = eco.erros===0 ? 3 : eco.erros<=3 ? 2 : 1, velho = state.progress.eco[eco.id] || {};
  const p = {...velho, fases:{...(velho.fases||{})}}, fn = eco.faseN, inteira = fn==='tudo' || eco.nFases<2;
  const ant = inteira ? (velho.estrelas ? velho : null) : p.fases[fn] || null;
  const recorde = !ant || eco.pontos>ant.pts;
  const novo = {pts: Math.max(eco.pontos, ant ? ant.pts : 0), estrelas: Math.max(estrelas, ant ? ant.estrelas : 0)};
  const todasAntes = ecoTodasFeitas(eco.id);
  if(inteira) Object.assign(p, novo);
  if(fn!=='tudo') p.fases[fn] = novo;
  state.progress.eco[eco.id] = p;
  // o que esta fase liberou: a seguinte ou, com todas feitas, a música inteira
  const liberou = eco.nFases<2 || fn==='tudo' || ant || velho.estrelas ? '' : !todasAntes && ecoTodasFeitas(eco.id) ? 'Todas as fases completas! Desafio final liberado: a música inteira.'
    : fn+1<eco.nFases && !ecoFaseFeita(eco.id, fn+1) ? `Fase ${fn+2} liberada!` : '';
  // música do dia feita: marca o dia (a sequência sobe)
  const doDia = eco.id===ecoDoDia() && !state.progress.ecoDias[dayKey()];
  if(doDia) state.progress.ecoDias[dayKey()] = true;
  logPractice('desafio'); saveProgress(); renderEcoMusicas();
  $('#ecoDiaFeita').hidden = !doDia;
  if(doDia) $('#ecoDiaFeita').textContent = t('Música do dia feita! Sequência: {} dia(s).', ecoSequenciaDias());
  $('#ecoJogo').hidden = true; const f = $('#ecoFimCard'); f.hidden = false;
  const gf = f.querySelector('.gaucho-fim'); gf.classList.remove('danca'); void gf.offsetWidth; gf.classList.add('danca');
  ecoTocarVideo(ecoFimVid);
  $('#ecoFimTit').textContent = inteira ? (estrelas===3 ? 'Perfeito! Música completa!' : 'Música completa!')
    : estrelas===3 ? `Perfeito! Fase ${fn+1} completa!` : `Fase ${fn+1} completa!`;
  $('#ecoFimLib').hidden = !liberou; $('#ecoFimLib').textContent = liberou;
  ecoMapa();
  $('#ecoFimMusica').textContent = eco.m.title;
  $('#ecoFimEstrelas').innerHTML = ecoEstrelas(estrelas);
  $('#ecoFimEstrelas').setAttribute('aria-label', `${estrelas} de 3 estrelas`);
  $('#ecoFimPts').textContent = eco.pontos;
  $('#ecoRecorde').hidden = !recorde || !ant;
  $('#ecoFimInfo').textContent = `${eco.erros} erro(s) · maior sequência: ${eco.maxCombo} notas`;
  // o botão de seguir: próxima fase, depois a música inteira, depois a próxima música (as suas músicas não têm "próxima")
  const i = ECO_MUSICAS.findIndex(x=>x.id===eco.id), segue = ecoSegue();
  $('#ecoProxima').hidden = segue==='musica' && (i<0 || i>=ECO_MUSICAS.length-1);
  $('#ecoProximaTxt').textContent = segue==='musica' ? 'Próxima música' : segue==='tudo' ? 'Música inteira' : 'Próxima fase';
  $('#ecoProxima').classList.toggle('sec', segue==='musica'); $('#ecoDeNovo').classList.toggle('sec', segue!=='musica');
  if(!movReduzido()){ // pontos contam do zero
    const el = $('#ecoFimPts'), fim = eco.pontos, t0 = performance.now() + 500;
    el.textContent = '0';
    const passo = agora=>{ const k = Math.max(0, Math.min(1, (agora-t0)/1100)); el.textContent = Math.round(fim*(1-Math.pow(1-k,3))); if(k<1 && el.isConnected) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
  f.scrollIntoView({block:'center', behavior: movReduzido()?'auto':'smooth'});
  if(estrelas===3 || (recorde && ant) || doDia || liberou) setTimeout(comemorar, 700); else vibrar('ok');
}
function ecoParar(){ ecoLimpar(); $('#ecoGaucho').classList.remove('aparece'); ecoVid.pause(); ecoFimVid.pause(); eco.fase = ''; $('#ecoJogo').hidden = true; $('#ecoFimCard').hidden = true; $('#ecoEscolha').hidden = false; }

$('#ecoParar').onclick = ecoParar;
$('#ecoRepetir').onclick = ()=>{ if(eco.fase==='vez'){ ecoTrilha(); ecoOuvir(); } };
$('#ecoDeNovo').onclick = ()=>ecoComecar(eco.faseN);
// depois desta partida: 'fase' (a seguinte), 'tudo' (a música inteira) ou 'musica' (a próxima música)
function ecoSegue(){ return eco.faseN==='tudo' || eco.nFases<2 ? 'musica' : eco.faseN+1<eco.nFases ? 'fase' : 'tudo'; }
$('#ecoOutra').onclick = ()=>{ ecoParar(); $('#ecoEscolha').scrollIntoView({block:'start', behavior: movReduzido()?'auto':'smooth'}); };
$('#ecoProxima').onclick = ()=>{
  const segue = ecoSegue(); if(segue!=='musica'){ ecoComecar(segue==='tudo' ? 'tudo' : eco.faseN+1); return; }
  const i = ECO_MUSICAS.findIndex(x=>x.id===eco.id); eco.id = ECO_MUSICAS[Math.min(i+1, ECO_MUSICAS.length-1)].id;
  store.set('ecoMusica', eco.id); renderEcoMusicas(); ecoComecar();
};
// a lista só é montada ao abrir a aba (a tela inicial abre mais rápido) e é refeita se o mapa dos botões mudou
ganchosAba.push(nova=>{
  if(nova!=='eco' && eco.fase && eco.fase!=='fim') ecoParar();
  if(nova!=='eco' && ecoMicDono){ micStop(); ecoMicDono = false; $('#ecoMicOn').checked = false; }
  if(nova==='eco'){ $('#ecoMicOn').checked = mic.on; if(!eco.fase){ Object.keys(ecoCache).forEach(k=>delete ecoCache[k]); renderEcoMusicas(); } }
});
