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
// dif: nível (1 Iniciante, 2 Intermediário, 3 Avançado). cat: 'esc' (escalas e exercícios) ou 'rep' (repertório).
// nova: dia em que a música entrou depois da estreia do jogo; o selo "Nova" fica 30 dias, enquanto o aluno não jogou.
const ECO_MUSICAS = [
  {id:'estrelinha', dif:1, cat:'rep'}, {id:'esc-do', dif:1, cat:'esc'}, {id:'ode', dif:1, cat:'rep'}, {id:'esq-do', dif:2, cat:'esc'},
  {id:'arpejos', dif:2, cat:'esc'}, {id:'esc-sol', dif:2, cat:'esc'}, {id:'esc-lam', dif:2, cat:'esc'}, {id:'esq-baixos', dif:2, cat:'esc'},
  {id:'cromatica', dif:3, cat:'esc'}, {id:'cumparsita', dif:2, cat:'rep', nova:'2026-11-07'}, {id:'choclo-intro', dif:3, cat:'rep'},
  {id:'tico-tico', dif:3, cat:'rep', nova:'2026-11-07'},
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
// Nível do aluno: começa pela resposta "Já toco bandoneon" das perguntas iniciais e sobe quando ele completa
// as músicas do nível (3, ou todas, se o nível tiver menos).
const ecoCompleta = id => !!ecoProg(id).estrelas || ecoTodasFeitas(id);
function ecoNivelAluno(){
  const p = (typeof perfilAluno==='function' && perfilAluno()) || {};
  let n = p.exp==='bandoneon' ? 2 : 1;
  for(;;){ const doNivel = ECO_MUSICAS.filter(x=>x.dif===n);
    if(n>=3 || doNivel.filter(x=>ecoCompleta(x.id)).length < Math.min(3, doNivel.length)) return n; n++; }
}
// Música do dia: sorteada pela data entre as do nível do aluno que ele ainda não completou. Fica guardada até
// o fim do dia (completar a música não troca a do dia). Fazer em dias seguidos aumenta a sequência.
function ecoDoDia(){
  const hoje = dayKey(), salvo = store.get('ecoDoDia', null);
  if(salvo && salvo.dia===hoje && ECO_MUSICAS.some(x=>x.id===salvo.id)) return salvo.id;
  let h = 7; for(const c of hoje) h = (h*31 + c.charCodeAt(0)) >>> 0;
  const doNivel = ECO_MUSICAS.filter(x=>x.dif===ecoNivelAluno()), faltam = doNivel.filter(x=>!ecoCompleta(x.id));
  const lista = faltam.length ? faltam : doNivel, id = lista[h % lista.length].id;
  store.set('ecoDoDia', {dia:hoje, id}); return id;
}
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
// No RepeTCHÊ a mão já aparece no cartão: "Mão esquerda: escala de Dó maior" vira "Escala de Dó maior"
const ecoTitulo = tit => { const x = tit.replace(/^Mão esquerda:\s*/, ''); return x.charAt(0).toUpperCase() + x.slice(1); };
const ecoEsc = x => String(x).replace(/[&<>\x22]/g, c=>'&#' + c.charCodeAt(0) + ';');
const ECO_NIVEL = {1:'Iniciante', 2:'Intermediário', 3:'Avançado'};
const ECO_CRIT = {3:'3 estrelas: sem erros', 2:'2 estrelas: até 3 erros', 1:'1 estrela: chegou ao fim'};
const ecoNivelHtml = n => `<span class="eco-nivel" data-n="${n}"><span class="p" aria-hidden="true"><i></i><i></i><i></i></span><span>${ECO_NIVEL[n]}</span></span>`;
const ecoNova = x => !!x.nova && !state.progress.eco[x.id] && Date.now() - new Date(x.nova + 'T12:00:00') < 30*864e5;
// Fases feitas e as estrelas que o cartão mostra: as da música inteira ou, antes dela, as da fase mais fraca
function ecoAndamento(id){
  const fs = ecoFases(id), r = ecoProg(id), feitas = fs.filter((_,k)=>ecoFaseFeita(id,k)), n = feitas.length;
  return {total:fs.length, feitas:n, est: r.estrelas || (n ? Math.min(...fs.map((_,k)=>{ const f = ecoFaseFeita(id,k); return f ? f.estrelas : 3; })) : 0)};
}
// Cartão de música: tocar em qualquer parte dele (ou em Praticar) começa; o alto-falante toca o começo
function ecoCartao(x, i){
  const id = x.id, {m, mao} = ecoMusica(id), a = ecoAndamento(id), r = ecoProg(id), prox = ecoProximaFase(id);
  const acao = r.estrelas ? 'Tocar de novo' : prox==='tudo' ? 'Desafio final' : a.feitas ? `Continuar: fase ${prox+1}` : 'Praticar';
  const selo = x.dif && id===ecoDoDia() ? '<span class="eco-selo dodia">★ Do dia</span>' : ecoNova(x) ? '<span class="eco-selo nova">Nova</span>' : '';
  const est = a.est ? `<span class="eco-est" title="${ECO_CRIT[a.est]}" aria-label="${ECO_CRIT[a.est]}">${'★'.repeat(a.est)}<span>${'★'.repeat(3-a.est)}</span></span>` : '';
  return `<div class="eco-carta ${r.estrelas ? 'feita' : ''}" style="--i:${i}" data-carta="${id}">
    <span class="eco-carta-topo">${x.dif ? ecoNivelHtml(x.dif) : '<span class="eco-sua">Sua</span>'}${selo}</span>
    <b class="eco-carta-tit">${ecoEsc(ecoTitulo(m.title))}</b>
    <span class="eco-mao-letra" data-mao="${mao}">${mao==='left' ? 'Mão esquerda' : 'Mão direita'}</span>
    <span class="eco-carta-base"><span class="eco-prog"><span class="eco-barrinha"><i style="width:${Math.round(100*a.feitas/a.total)}%"></i></span><span>${a.feitas} de ${a.total} fases</span>${est}</span>
    <span class="eco-carta-acoes"><button type="button" class="eco-praticar" data-id="${id}"><svg aria-hidden="true"><use href="#i-play"/></svg><span>${acao}</span></button><button type="button" class="eco-ouvir" data-ouvir="${id}" aria-label="Ouvir o começo" title="Ouvir o começo"><svg aria-hidden="true"><use href="#i-volume"/></svg></button></span></span>
  </div>`;
}
const ECO_FILTROS = [
  {k:'todas', r:'Todas', f:()=>true}, {k:'right', r:'Mão direita', f:x=>ecoMusica(x.id).mao==='right'}, {k:'left', r:'Mão esquerda', f:x=>ecoMusica(x.id).mao==='left'},
  {k:'esc', r:'Escalas e exercícios', f:x=>x.cat==='esc'}, {k:'rep', r:'Repertório', f:x=>x.cat==='rep'}];
let ecoFiltro = store.get('ecoFiltro', 'todas');
function renderEcoMusicas(){
  const f = ECO_FILTROS.find(x=>x.k===ecoFiltro) || ECO_FILTROS[0];
  $('#ecoFiltros').innerHTML = ECO_FILTROS.map(x=>`<button type="button" class="eco-filtro" data-filtro="${x.k}" aria-pressed="${x.k===f.k}"><span>${x.r}</span><i>${ECO_MUSICAS.filter(x.f).length}</i></button>`).join('');
  $('#ecoMusicas').innerHTML = ECO_MUSICAS.filter(f.f).map((x,i)=>ecoCartao(x, i)).join('');
  const suas = ecoSuas().filter(id=>{ const mm = ecoMusica(id); return mm && mm.seq.length>=4; });
  $('#ecoSuas').innerHTML = suas.map((id,i)=>ecoCartao({id, dif:0}, i)).join('');
  $('#ecoSuasVazio').hidden = suas.length>0;
  renderEcoDia(); ecoPilulas();
}
// Música do dia: o atalho de um toque, com o nível, as fases e a sequência de dias. O gaúcho do topo ganha um
// brilho enquanto a sequência está viva.
function renderEcoDia(){
  const id = ecoDoDia(), x = ECO_MUSICAS.find(y=>y.id===id), mm = ecoMusica(id), a = ecoAndamento(id);
  const feita = !!state.progress.ecoDias[dayKey()], seq = ecoSequenciaDias();
  const data = new Date().toLocaleDateString(document.documentElement.lang || 'pt-BR', {day:'numeric', month:'long'});
  const el = $('#ecoDia'); el.classList.toggle('feita', feita);
  el.innerHTML = `<svg class="eco-marca-fole" viewBox="0 0 220 100" aria-hidden="true"><rect x="0" y="10" width="14" height="80" rx="4"/><rect x="206" y="10" width="14" height="80" rx="4"/><path d="M24 12 L40 88 L56 12 L72 88 L88 12 L104 88 L120 12 L136 88 L152 12 L168 88 L184 12 L196 88"/></svg>`
    + `<div class="eco-dia-txt"><span class="eco-dia-olho"><span>Música do dia</span><span translate="no">${data}</span></span>`
    + `<h3 class="eco-dia-tit">${ecoEsc(ecoTitulo(mm.m.title))}</h3>`
    + `<span class="eco-dia-meta">${ecoNivelHtml(x.dif)}<span>${mm.mao==='left' ? 'Mão esquerda' : 'Mão direita'}</span><span>${a.total} fases</span></span>`
    + `<span class="eco-dia-prog"><span class="eco-barrinha"><i style="width:${Math.round(100*a.feitas/a.total)}%"></i></span><span>${a.feitas} de ${a.total} fases</span></span>`
    + `<span class="eco-dia-nota">${feita ? 'Feita hoje! Amanhã tem outra.' : 'Escolhida para o seu nível. Amanhã tem outra.'}</span></div>`
    + `<div class="eco-dia-acoes"><span class="eco-fogo ${seq ? 'on' : ''}" title="Dias seguidos com a música do dia feita"><svg aria-hidden="true"><use href="#i-flame"/></svg><span>${seq===1 ? '1 dia' : seq + ' dias'}</span></span>`
    + `<button type="button" class="btn btn-grande" data-id="${id}"><svg aria-hidden="true"><use href="#i-play"/></svg><span>${feita ? 'Jogar de novo' : 'Jogar'}</span></button></div>`;
  const av = $('#v-eco .pg-av'); if(av){ av.classList.toggle('brilha', seq>0); av.title = seq ? t(plural(seq, 'Sequência de {} dia: o gaúcho comemora com você', 'Sequência de {} dias: o gaúcho comemora com você'), seq) : ''; }
}
// Ouvir o começo: os primeiros 2 segundos da música, com as mesmas notas do jogo e o som do app.
// Tocar de novo no mesmo alto-falante (ou começar o jogo) para.
let ecoPreviaT = [], ecoPreviaCarta = null;
function ecoPrevia(id, carta){
  const mesma = carta && carta===ecoPreviaCarta;
  ecoPreviaT.forEach(clearTimeout); ecoPreviaT = []; if(ecoPreviaCarta) ecoPreviaCarta.classList.remove('toca'); ecoPreviaCarta = null;
  if(!id || mesma) return;
  const mm = ecoMusica(id); if(!mm) return;
  ac(); const spb = 60/mm.m.bpm; let t = 0;
  for(const n of mm.seq){ if(t >= 2000) break; const dur = Math.min(1.1, Math.max(0.25, n.beats*spb));
    ecoPreviaT.push(setTimeout(()=>playNote(n.midi, dur*0.92, n.hand), t)); t += dur*1000; }
  if(carta){ carta.classList.add('toca'); ecoPreviaCarta = carta; ecoPreviaT.push(setTimeout(()=>{ carta.classList.remove('toca'); ecoPreviaCarta = null; }, t)); }
}
// Como o aluno vai tocar: na tela ou no bandoneon de verdade (o microfone ouve). A escolha fica guardada.
const ecoTocarModo = () => store.get('ecoTocar', 'tela');
function ecoModoTocar(v){
  store.set('ecoTocar', v);
  $$('#ecoTocar [data-tocar]').forEach(b=>b.setAttribute('aria-checked', String(b.dataset.tocar===v)));
  $('#ecoMic').hidden = v!=='instrumento';
  $('#ecoModoNota').textContent = v==='instrumento' ? 'Ao começar, o app pede acesso ao microfone. Deixe o celular ou o computador a meio metro do bandoneon.'
    : 'A escolha fica guardada para os próximos jogos.';
  if(v!=='instrumento' && ecoMicDono){ micStop(); ecoMicDono = false; }
  ecoMicUI();
}
// Teste do microfone dentro da tela: volume (24 barrinhas; e 10 no cartão), a nota ouvida e a afinação
function ecoMicUI(){
  const on = mic.on;
  $('#ecoMic').classList.toggle('ativo', on); $('#ecoTocar [data-tocar="instrumento"]').classList.toggle('vivo', on);
  $('#ecoMicStatus span').textContent = on ? 'Microfone ativo' : 'Microfone desligado';
  $('#ecoMicLigar span').textContent = on ? 'Desligar' : 'Ligar e testar'; $('#ecoMicLigar').classList.toggle('sec', on);
  $('#ecoMicCal').disabled = !on;
  $('#ecoMicDica').textContent = on ? 'Toque uma nota no bandoneon: a barra mostra o volume e a nota aparece ao lado.'
    : 'Ligue o microfone e toque uma nota no bandoneon para testar antes de jogar.';
  ecoMicMostrar(null);
}
let ecoMiniEstado = '';
function ecoMicMostrar(m, cents, rms){ // o microfone chama a cada leitura (js/microfone.js)
  const f = m==null ? 0 : Math.min(1, (rms || 0)*4), n24 = Math.round(f*24), n10 = Math.round(f*10);
  $$('#ecoVu i').forEach((i,j)=>{ i.className = j<n24 ? (j>19 ? 'on alto' : 'on') : ''; });
  $$('#ecoMvu i').forEach((i,j)=>{ i.className = j<n10 ? 'on' : ''; });
  const est = !mic.on ? 'off' : m==null ? 'mudo' : 'n' + m + (Math.abs(cents)<=5 ? 'a' : cents);
  if(est===ecoMiniEstado) return; ecoMiniEstado = est; // só reescreve o texto quando muda (a tradução reage a cada mudança)
  $('#ecoMicNota').textContent = m==null ? '–' : noteName(m);
  $('#ecoMicCents').textContent = m==null ? (mic.on ? 'silêncio' : 'nota ouvida') : Math.abs(cents)<=5 ? 'afinado' : (cents>0 ? '+' : '−') + Math.abs(cents) + ' cents';
  const mini = $('#ecoMiniTxt');
  if(!mic.on) mini.textContent = 'Microfone desligado: teste abaixo';
  else if(m==null) mini.textContent = 'Microfone ativo: toque uma nota';
  else mini.innerHTML = `<span>Nota detectada:</span> <b translate="no">${noteName(m)}</b> <span class="ok">Bandoneon pronto!</span>`;
}
// Entrada de áudio: microfone do aparelho, interface USB, fone… Os nomes só aparecem depois da permissão.
async function ecoMicEntradas(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
  let ds = []; try{ ds = (await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='audioinput' && d.deviceId && !['default','communications'].includes(d.deviceId)); }catch(e){ return; }
  const sel = $('#ecoMicEntrada'), atual = store.get('micEntrada', '');
  sel.innerHTML = '<option value="">Microfone padrão do aparelho</option>'
    + ds.map((d,i)=>`<option value="${ecoEsc(d.deviceId)}" translate="no">${ecoEsc(d.label || t('Entrada {}', i+1))}</option>`).join('');
  sel.value = ds.some(d=>d.deviceId===atual) ? atual : '';
  $('#ecoMicEntradaRot').hidden = ds.length<2;
}
let ecoMicDono = false; // o microfone foi ligado aqui (e desliga ao sair da aba)
$('#ecoMicLigar').addEventListener('click', async ()=>{
  if(mic.on){ micStop(); ecoMicDono = false; }
  else if(await micStart()){ ecoMicDono = true; marcar('mic'); ecoMicEntradas(); }
  ecoMicUI();
});
$('#ecoMicCal').addEventListener('click', ()=>{
  if(!mic.on) return; $('#ecoMicCal').disabled = true;
  calibrarSilencio(msg=>{ $('#ecoMicDica').textContent = msg; }, ()=>{ $('#ecoMicCal').disabled = !mic.on; });
});
$('#ecoMicEntrada').addEventListener('change', async e=>{
  store.set('micEntrada', e.target.value);
  if(mic.on){ micStop(); if(!(await micStart())) ecoMicDono = false; }
  ecoMicUI();
});
$('#ecoVu').innerHTML = '<i></i>'.repeat(24); $('#ecoMvu').innerHTML = '<i></i>'.repeat(10);
// Ajustes do treino: recolhidos, com o resumo em pílulas (a que acabou de mudar acende)
const ECO_AJ = {ver:'Ver e ouvir', fole:'Só o fole', ouvido:'Só ouvindo'};
function ecoPilulas(mudou){
  const ps = [['ecoAjuda', ECO_AJ[$('#ecoAjuda').value]], ['ecoPasso', `${$('#ecoPasso').value} notas por rodada`],
    ['ecoVel', $('#ecoVel').value==='1' ? 'Normal' : 'Devagar'], ['ecoVozOn', $('#ecoVozOn').checked ? 'Voz do gaúcho' : 'Sem a voz do gaúcho']];
  $('#ecoPilulas').innerHTML = ps.map(([k, txt])=>`<span class="eco-pilula ${k===mudou ? 'muda' : ''}">${txt}</span>`).join('');
  if(mudou) setTimeout(()=>{ const x = $('#ecoPilulas .muda'); if(x) x.classList.remove('muda'); }, 900);
}
// Tocar numa música (o cartão inteiro, Praticar ou o Jogar da música do dia) já começa
$('#ecoEscolha').addEventListener('click', e=>{
  const ov = e.target.closest('[data-ouvir]'); if(ov){ ecoPrevia(ov.dataset.ouvir, ov.closest('.eco-carta')); return; }
  const fl = e.target.closest('[data-filtro]'); if(fl){ ecoFiltro = fl.dataset.filtro; store.set('ecoFiltro', ecoFiltro); renderEcoMusicas(); return; }
  const tc = e.target.closest('[data-tocar]'); if(tc){ ecoModoTocar(tc.dataset.tocar); return; }
  let b = e.target.closest('[data-id]');
  if(!b && !e.target.closest('button, a, input, select, label, summary')){ const c = e.target.closest('[data-carta]'); if(c) b = c.querySelector('[data-id]'); }
  if(!b) return;
  eco.id = b.dataset.id; store.set('ecoMusica', eco.id);
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
  $('#'+id).addEventListener('change', e=>{ store.set(id, e.target.value); ecoPilulas(id); }); });
{ const salvo = store.get('ecoMusica', null); if(salvo && ecoFonte(salvo)) eco.id = salvo; }

/* ---------- Partes da tela que mudam durante o jogo ---------- */
// Faixa do topo: "Ouça…", "Sua vez!", "Perfeito!". Remove e põe a classe de novo para reiniciar a animação.
function ecoFaixa(txt, tipo, sub=''){
  const f = $('#ecoFaixa'); f.className = 'eco-faixa'; void f.offsetWidth; f.classList.add(tipo);
  $('#ecoFaixaTxt').textContent = txt; $('#ecoFaixaSub').textContent = sub;
}
// O fole no palco: o selo (Abrindo/Fechando), a sanfona que abre e fecha e o brilho do teclado na cor da direção.
// Ajuda "Só ouvindo": enquanto o bandoneon toca, nada entrega a direção (selo neutro, sem brilho e sem os nomes
// nos botões, que mudariam com o fole). Na vez do aluno o fole volta a aparecer: quem troca a direção é o jogo.
function ecoDirPill(){
  const escondido = eco.ajuda==='ouvido' && eco.fase==='ouvir', p = $('#ecoDir');
  $('#ecoPalco').dataset.fole = escondido ? 'oculto' : eco.dir;
  p.className = 'dirpill ' + (escondido ? 'oculto' : eco.dir); p.textContent = escondido ? t('Fole escondido') : dirLabel(eco.dir);
  ecoKb().refresh(); ecoKb().retune();
}
// a cada nota que o bandoneon toca (com o fole à vista), a sanfona dá um pulso no ritmo
function ecoPulsoFole(){ if(eco.ajuda==='ouvido') return; const f = $('#ecoFole'); f.classList.remove('pulsa'); void f.offsetWidth; f.classList.add('pulsa'); }
// A Ajuda também muda no meio do jogo (os três botões acima do teclado): vale a partir do próximo "Ouça…"
function ecoMarcarModo(){ $$('#ecoModo [data-ajuda]').forEach(b=>{ const on = b.dataset.ajuda===eco.ajuda; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); }
$('#ecoModo').addEventListener('click', e=>{
  const b = e.target.closest('[data-ajuda]'); if(!b || b.dataset.ajuda===eco.ajuda) return;
  eco.ajuda = b.dataset.ajuda; $('#ecoAjuda').value = eco.ajuda; store.set('ecoAjuda', eco.ajuda); ecoMarcarModo(); ecoPilulas();
  if(eco.fase==='ouvir'){ ecoTrilha(); ecoOuvir(); } else ecoDirPill(); // ouvindo: recomeça o trecho já no modo novo
});
$('#ecoAjuda').addEventListener('change', ()=>{ eco.ajuda = $('#ecoAjuda').value; ecoMarcarModo(); });
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
$('#ecoVozOn').addEventListener('change', e=>{ store.set('ecoVoz', e.target.checked); ecoPilulas('ecoVozOn'); if(e.target.checked) ecoTocarVideo(ecoVid); }); // ligou: ouve como fica
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
  ac(); ecoLimpar(); ecoPrepararGaucho(); ecoPrevia(null);
  // "No meu bandoneon": liga o microfone ao começar (o toque no cartão é o gesto que o navegador pede)
  if(ecoTocarModo()==='instrumento' && !mic.on) micStart().then(ok=>{ if(ok){ ecoMicDono = true; marcar('mic'); } ecoMicUI(); });
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
  $('#ecoMao').textContent = t(eco.hand==='left' ? 'Mão esquerda' : 'Mão direita'); $('#ecoMao').dataset.mao = eco.hand; ecoMarcarModo();
  $('#ecoMusicaTit').textContent = ecoTitulo(m.title);
  $('#ecoFaseTit').hidden = fs.length<2;
  $('#ecoFaseTit').textContent = f==='tudo' ? 'Música inteira' : `Fase ${f+1} de ${fs.length}`;
  ecoMapa();
  $('#ecoTrilha').innerHTML = seq.map(()=>'<i></i>').join('');
  $('#ecoPontos').textContent = '0'; eco.dir = seq[0].dir; ecoDirPill(); ecoHud(); ecoTrilha(); ecoFeed('');
  requestAnimationFrame(()=>ecoEnquadrar(true));
  // contagem 3, 2, 1
  [3,2,1].forEach((n,i)=>ecoTimer(()=>ecoFaixa(String(n), 'conta'), i*520));
  ecoTimer(ecoRodada, 3*520);
}
// Deixa na tela o que importa durante o jogo: a faixa ("Ouça…", "Sua vez!") e o teclado com os controles.
// Em janela baixa (tela dividida, notebook pequeno) rolar até o topo do cartão deixava o teclado fora da tela,
// e o aluno ouvia as notas sem ver os botões acenderem. inicio: o jogo acabou de abrir (mostra o cartão
// inteiro se couber); fora isso, só rola quando o teclado não está todo visível.
function ecoEnquadrar(inicio){
  if($('#ecoJogo').hidden) return;
  const cab = document.querySelector('header'), topo = cab ? Math.max(0, cab.getBoundingClientRect().bottom) : 0;
  const nav = $('#nav'), rn = nav && getComputedStyle(nav).position==='fixed' ? nav.getBoundingClientRect() : null;
  const limite = rn && rn.top > innerHeight/2 ? rn.top : innerHeight; // no celular a barra das áreas fica embaixo
  const jogo = $('#ecoJogo').getBoundingClientRect(), faixa = $('#ecoFaixa').getBoundingClientRect();
  const kb = ecoKb().el.getBoundingClientRect(), fim = Math.max(kb.bottom, $('#ecoParar').getBoundingClientRect().bottom) + 8;
  const espaco = limite - topo;
  let dy = null;
  if(inicio && fim - jogo.top <= espaco) dy = jogo.top - topo - 8;                 // cabe tudo: o cartão desde o topo
  else if(faixa.top >= topo && kb.bottom <= limite) return;                         // faixa e teclado já à vista
  else if(fim - faixa.top <= espaco) dy = fim - limite;                             // da faixa aos controles
  else dy = kb.bottom + 8 - limite;                                                 // pelo menos o teclado inteiro
  if(Math.abs(dy) > 2) window.scrollBy({top:dy, behavior: movReduzido() ? 'auto' : 'smooth'});
}
let ecoEnquadrarTimer = 0;
window.addEventListener('resize', ()=>{ clearTimeout(ecoEnquadrarTimer); ecoEnquadrarTimer = setTimeout(()=>{ if(currentView==='eco' && eco.fase && eco.fase!=='fim') ecoEnquadrar(); }, 250); });
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
  ecoEnquadrar(); // o teclado precisa estar à vista para ver os botões acenderem
  const spb = 60/(eco.m.bpm*eco.vel); let t = 350;
  for(let i=eco.ini; i<eco.alvo; i++){
    const n = eco.seq[i], dur = Math.min(1.1, Math.max(0.3, n.beats*spb));
    ecoTimer(()=>{
      eco.dir = n.dir; ecoDirPill(); ecoPulsoFole(); ecoPonto(i, 'soa');
      playNote(n.midi, dur*0.92, n.hand);
      // "Ver e ouvir": o botão acende e o nome da nota aparece na faixa, junto com o som
      if(eco.ajuda==='ver'){ ecoKb().mark(n.btn.id, 'down', dur*850); $('#ecoFaixaSub').textContent = noteName(n.midi); }
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
  if(doDia) $('#ecoDiaFeita').textContent = t(plural(ecoSequenciaDias(), 'Música do dia feita! Sequência: {} dia.', 'Música do dia feita! Sequência: {} dias.'), ecoSequenciaDias());
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
  { const e = eco.erros, c = eco.maxCombo; $('#ecoFimInfo').textContent = c > 1 ? (!e ? `Nenhum erro · maior sequência: ${c} notas` : e===1 ? `1 erro · maior sequência: ${c} notas` : `${e} erros · maior sequência: ${c} notas`) : (!e ? 'Nenhum erro' : e===1 ? '1 erro' : `${e} erros`); }
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
  if(nova!=='eco'){ ecoPrevia(null); if(ecoMicDono){ micStop(); ecoMicDono = false; } }
  if(nova==='eco'){ ecoModoTocar(ecoTocarModo()); if(!eco.fase){ Object.keys(ecoCache).forEach(k=>delete ecoCache[k]); renderEcoMusicas(); } }
});
// Ajuda, notas por rodada e velocidade viram botões lado a lado (js/menus.js)
segmentar($('#ecoAjuda'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'}); segmentar($('#ecoPasso'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'}); segmentar($('#ecoVel'));
// "Notas novas por rodada": a explicação embaixo diz o que acontece com o número escolhido
function ecoPassoAjuda(){ $('#ecoPassoAjuda').textContent = t('A música cresce aos poucos: a cada rodada, o bandoneon toca o trecho de novo com mais {} notas, e você repete tudo.', $('#ecoPasso').value); }
$('#ecoPasso').addEventListener('change', ecoPassoAjuda); ecoPassoAjuda();
