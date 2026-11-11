/* ================== Qual é a nota? (Treinar → Ouvido, junto com o Ache pelo som de js/ouvido.js) ==================
   Um quiz de ouvido: o bandoneon toca a nota de um botão, a onda do som aparece na tela e o aluno escolhe
   entre quatro nomes. A referência (o Dó central) não toca colada na pergunta: um pop-up grande avisa e toca o Dó
   sozinho, e a nota da pergunta só vem quando o aluno aperta "Ouvir a pergunta" (assim nunca parecem duas notas). Ao lado ficam "Ouça outra vez" (repetir não custa nada) e "Dica", em três passos:
   onde fica no teclado (a zona no mapa da mão), se é mais aguda ou mais grave que o Dó central e, por fim,
   duas alternativas erradas riscadas. Acerto com dica conta, mas o recorde é só de acertos sem dica.
   Dez perguntas por rodada; as notas que o aluno erra voltam mais vezes (progresso em progress.qualnota). */
const QN_RODADAS = 10, QN_DO = 60; // a referência é o Dó central (Dó4)
const qn = {ativo:false, sessao:0, rodada:0, acertos:0, semDica:0, alvo:null, opcoes:[], respondeu:false,
  dicas:0, riscadas:[], zona:null, hist:[], timers:[], tocouEm:0, esperaRef:false};
const qnProg = () => state.progress.qualnota || (state.progress.qualnota = {melhor:null, notas:{}});
const qnClasse = m => ((m % 12) + 12) % 12;
const qnNatural = m => NATURAIS.includes(qnClasse(m));
const qnNivel = () => +$('#qnNivel').value || 1;
const qnMaos = () => $('#qnMao').value==='both' ? ['left', 'right'] : [$('#qnMao').value];
function qnEmbaralhar(a){ a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function qnDepois(ms, f){ qn.timers.push(setTimeout(f, ms)); }
function qnLimparTimers(){ qn.timers.forEach(clearTimeout); qn.timers = []; }

/* ---------- Sorteio ---------- */
// Tudo o que as mãos escolhidas tocam: um item por botão e direção do fole (no fácil e no médio, só as naturais)
function qnBanco(){
  const so = qnNivel() < 3, L = [];
  for(const mao of qnMaos()) for(const b of state.layout[mao]) for(const dir of ['open', 'close']){
    if(!so || qnNatural(b[dir])) L.push({mao, b, dir, midi:b[dir]});
  }
  return L;
}
// As notas que você erra (e as que ainda não apareceram) saem mais; a da pergunta anterior quase nunca
function qnPeso(it){
  const s = qnProg().notas[it.midi];
  return (s ? 0.4 + 3 * (s.err + 0.5) / (s.ok + s.err + 1) : 1.5) * (qn.alvo && it.midi===qn.alvo.midi ? 0.05 : 1);
}
function qnSortear(L){
  const w = L.map(qnPeso); let r = Math.random() * w.reduce((a, b)=>a + b, 0);
  for(let i = 0; i < L.length; i++){ r -= w[i]; if(r <= 0) return L[i]; }
  return L[L.length - 1];
}
// Três alternativas erradas, sempre com nomes diferentes da certa (nunca Sol3 contra Sol4).
// Fácil: notas bem afastadas, que o registro já separa; médio: até uma sexta de distância; difícil: vizinhas, com sustenidos.
function qnAlternativas(alvo, L){
  const nivel = qnNivel(), so = nivel < 3, notas = L.map(x=>x.midi);
  const lo = Math.min(...notas), hi = Math.max(...notas), cand = [];
  for(let m = lo; m <= hi; m++) if(qnClasse(m)!==qnClasse(alvo) && (!so || qnNatural(m))) cand.push(m);
  const perto = nivel===1 ? d=>d >= 5 : nivel===2 ? d=>d <= 9 : d=>d <= 5;
  const erradas = [];
  const juntar = (filtro, sep) => {
    for(const m of qnEmbaralhar(cand.filter(m=>filtro(Math.abs(m - alvo))))){
      if(erradas.length >= 3) return;
      if(erradas.every(x=>qnClasse(x)!==qnClasse(m) && Math.abs(x - m) >= sep)) erradas.push(m);
    }
  };
  juntar(perto, nivel===1 ? 4 : 1); juntar(()=>true, 1); // se faltar (nota na ponta do teclado), completa com o que houver
  return qnEmbaralhar([alvo, ...erradas]);
}

/* ---------- A onda: o som de verdade, lido do Web Audio ---------- */
// Janela fixa de 1024 amostras (uns 21 ms): quanto mais aguda a nota, mais ondas cabem na tela.
let qnAn = null, qnBuf = null, qnRaf = 0, qnAte = 0, qnAlvoDe = 0, qnUlt = null, qnUltPico = 0;
function qnAnalisador(){
  if(!qnAn){ ac(); qnAn = AC.createAnalyser(); qnAn.fftSize = 2048; master.connect(qnAn); qnBuf = new Float32Array(qnAn.fftSize); }
  return qnAn;
}
const qnPico = d => { let p = 0; for(let i = 0; i < d.length; i++){ const v = Math.abs(d[i]); if(v > p) p = v; } return p; };
function qnDesenhar(d, pico, parado){
  const cv = $('#qnCanvas'), w = cv.clientWidth, h = cv.clientHeight; if(!w || !h) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if(cv.width!==Math.round(w * dpr) || cv.height!==Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  c.strokeStyle = 'rgba(241,240,236,.1)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  if(!d) return;
  // gatilho de osciloscópio: começa na subida pelo zero mais íngreme, para a onda ficar parada na tela
  const N = 1024; let i0 = 1, melhor = -1;
  for(let i = 1; i < d.length - N; i++) if(d[i - 1] < 0 && d[i] >= 0 && d[i] - d[i - 1] > melhor){ melhor = d[i] - d[i - 1]; i0 = i; }
  const k = h * 0.4 / Math.max(pico, 0.03);
  const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#b997ff'); g.addColorStop(1, '#e2d4ff');
  c.strokeStyle = g; c.lineWidth = 2.2; c.lineJoin = 'round'; c.globalAlpha = parado ? 0.6 : 1;
  c.shadowColor = 'rgba(185,151,255,.55)'; c.shadowBlur = parado ? 0 : 8;
  c.beginPath();
  for(let j = 0; j < N; j++){ const x = j / (N - 1) * w, y = h / 2 - d[i0 + j] * k; j ? c.lineTo(x, y) : c.moveTo(x, y); }
  c.stroke(); c.globalAlpha = 1; c.shadowBlur = 0;
}
function qnPasso(){
  const agora = performance.now();
  qnAn.getFloatTimeDomainData(qnBuf);
  const p = qnPico(qnBuf);
  if(p > 0.004){ qnDesenhar(qnBuf, p); if(agora >= qnAlvoDe){ qnUlt = Float32Array.from(qnBuf); qnUltPico = p; } }
  if(agora < qnAte && currentView==='qualnota') qnRaf = requestAnimationFrame(qnPasso);
  else { qnRaf = 0; qnDesenhar(qnUlt, qnUltPico, true); } // no silêncio fica a última imagem da nota, para olhar com calma
}
// inicio: em quantos segundos começa a nota da pergunta (antes dela pode vir a referência); dur: quanto ela dura
function qnOnda(inicio, dur){
  qnAnalisador(); const agora = performance.now();
  qnAlvoDe = agora + inicio * 1000; qnAte = agora + (inicio + dur + 0.3) * 1000;
  if(movReduzido()){ // sem animação: uma foto da onda no meio da nota
    setTimeout(()=>{ qnAn.getFloatTimeDomainData(qnBuf); const p = qnPico(qnBuf); if(p > 0.004){ qnUlt = Float32Array.from(qnBuf); qnUltPico = p; qnDesenhar(qnUlt, p, true); } }, (inicio + 0.35) * 1000);
    return;
  }
  if(!qnRaf) qnRaf = requestAnimationFrame(qnPasso);
}
function qnRotulo(txt){ $('#qnOndaRot').textContent = txt; }

/* ---------- Tocar ---------- */
// A nota da pergunta, sempre sozinha
function qnTocar(){
  if(!qn.alvo) return;
  const c = ac(); qn.tocouEm = performance.now();
  playNote(qn.alvo.midi, 1.3, qn.alvo.mao, c.currentTime + 0.05);
  qnOnda(0.05, 1.3);
  qnRotulo(qn.respondeu ? qnRotuloResposta() : t('Qual é esta nota?'));
  anelToque($('#qnOnda'));
}
function qnRepetir(){ if(qn.alvo && performance.now() - qn.tocouEm > 250) qnTocar(); }

/* ---------- O pop-up do Dó central, antes de cada pergunta ---------- */
// Abre, toca o Dó sozinho e espera: a pergunta só toca quando o pop-up fecha (botão, Enter ou Esc)
function qnAbrirRef(){
  const d = $('#qnRefDlg'); qn.esperaRef = true;
  $('#qnRefNome').textContent = noteName(QN_DO);
  $('#qnRefPasso').textContent = t('Antes da pergunta {} de 10', qn.rodada + 1);
  if(!d.open) d.showModal();
  $('#qnRefSeguir').focus();
  qnDepois(350, qnTocarDo);
}
function qnTocarDo(){
  ac(); playNote(QN_DO, 1.1, 'right');
  const disco = $('#qnRefDisco'); disco.classList.remove('soando'); void disco.offsetWidth; disco.classList.add('soando');
}
// Fechou (pelo botão, Enter ou Esc): um respiro e então a pergunta, sozinha
function qnRefFechou(){
  if(!qn.esperaRef) return;
  qn.esperaRef = false; qnLimparTimers();
  if(qn.ativo && qn.alvo && !qn.respondeu) qnDepois(350, qnTocar);
}
function qnFecharRef(semDo){
  if(semDo){ $('#qnRef').checked = false; store.set('qualnotaRef', false); }
  qnRefFechou(); const d = $('#qnRefDlg'); if(d.open) d.close();
}
function qnOuvirDo(){ ac(); playNote(QN_DO, 0.9, 'right'); qnRotulo(t('Referência: {}', noteName(QN_DO))); qnOnda(0.05, 0.9);
  if(qn.alvo) qnDepois(1100, ()=>qnRotulo(qn.respondeu ? qnRotuloResposta() : t('Qual é esta nota?'))); }
const qnRotuloResposta = () => `${noteName(qn.alvo.midi)} · ${Math.round(freq(qn.alvo.midi))} Hz`;

/* ---------- Tela ---------- */
function qnFeed(msg, cls=''){ const f = $('#qnFeed'); f.className = 'feedback ' + cls; f.textContent = msg; }
function qnRenderOpcoes(){
  const ops = qn.alvo ? qn.opcoes : [null, null, null, null];
  $('#qnOpcoes').innerHTML = ops.map((m, i)=>`<button type="button" class="qn-op" data-m="${m==null ? '' : m}" ${m==null ? 'disabled' : ''}>
    <kbd aria-hidden="true">${i + 1}</kbd><b translate="no">${m==null ? '?' : noteName(m)}</b></button>`).join('');
}
function qnBolinhas(){
  $('#qnBolinhas').innerHTML = Array.from({length:QN_RODADAS}, (_, i)=>{
    const h = qn.hist[i];
    return `<i class="${h ? (h.certo ? (h.dica ? 'certa-dica' : 'certa') : 'errada') : i===qn.rodada && qn.ativo ? 'agora' : ''}"></i>`;
  }).join('');
  $('#qnRodada').textContent = Math.min(QN_RODADAS, qn.rodada + (qn.respondeu ? 0 : 1)); $('#qnAcertos').textContent = qn.acertos;
}
function qnBotoes(){
  const jogo = qn.ativo && !!qn.alvo;
  $('#qnRepetir').disabled = !jogo; $('#qnOnda').disabled = !jogo;
  $('#qnDicaBtn').disabled = !jogo || qn.respondeu || qn.dicas >= 3;
  $('#qnDicaBtnTxt').textContent = qn.dicas===0 ? t('Ver uma dica') : qn.dicas < 3 ? t('Mais uma dica ({} de 3)', qn.dicas + 1) : t('Sem mais dicas');
  menuPratica('qn', qn.ativo); // durante o quiz, o menu vira uma barra com o resumo e "Parar"
}

/* ---------- Dica e o mapa da mão ---------- */
// A zona é contada como no desenho do teclado do app: em cima/no meio/embaixo e esquerda/centro/direita
const QN_ZONAS = [
  ['Fica na parte de cima, à esquerda.', 'Fica na parte de cima, no centro.', 'Fica na parte de cima, à direita.'],
  ['Fica no meio do teclado, à esquerda.', 'Fica bem no meio do teclado.', 'Fica no meio do teclado, à direita.'],
  ['Fica na parte de baixo, à esquerda.', 'Fica na parte de baixo, no centro.', 'Fica na parte de baixo, à direita.']];
function qnLimites(mao){ const L = state.layout[mao]; return {W:Math.max(...L.map(b=>b.x)), H:Math.max(...L.map(b=>b.y))}; }
function qnZonaTexto(a){
  const {W, H} = qnLimites(a.mao), terco = (v, max) => v < max / 3 ? 0 : v > 2 * max / 3 ? 2 : 1;
  return `${t(a.mao==='left' ? 'Mão esquerda' : 'Mão direita')}, ${t(a.dir==='open' ? 'abrindo o fole' : 'fechando o fole')}. ${t(QN_ZONAS[terco(a.b.y, H)][terco(a.b.x, W)])}`;
}
function qnRegistroTexto(m){
  const d = m - QN_DO;
  return t(d >= 12 ? 'Fica uma oitava ou mais acima do Dó central.' : d > 0 ? 'É mais aguda que o Dó central, a menos de uma oitava dele.'
    : d===0 ? 'Compare com o Dó central: ela está bem perto dele.' : d > -12 ? 'É mais grave que o Dó central, a menos de uma oitava dele.' : 'Fica uma oitava ou mais abaixo do Dó central.');
}
// O mapa: os botões da mão, com a zona acesa (dica) ou o botão exato aceso (depois de responder)
function qnMapa(){
  const a = qn.alvo, box = $('#qnMapaBox');
  if(!a || (!qn.dicas && !qn.respondeu)){ box.hidden = true; return; }
  box.hidden = false;
  const L = state.layout[a.mao], {W, H} = qnLimites(a.mao), z = qn.zona;
  const naZona = b => !qn.respondeu && Math.hypot(b.x - z.x, b.y - z.y) < 1.45;
  $('#qnMapa').setAttribute('viewBox', `-0.15 -0.15 ${W + 1.3} ${H + 1.3}`);
  $('#qnMapa').innerHTML = (qn.respondeu ? '' : `<circle class="qn-zona" cx="${z.x + .5}" cy="${z.y + .5}" r="1.55"/>`)
    + L.map(b=>`<circle cx="${b.x + .5}" cy="${b.y + .5}" r=".4" class="${qn.respondeu && b===a.b ? 'alvo ' + a.dir : naZona(b) ? 'na-zona' : ''}"/>`).join('')
    + (qn.respondeu ? `<circle class="qn-anel ${a.dir}" cx="${a.b.x + .5}" cy="${a.b.y + .5}" r=".62"/>` : '');
  $('#qnMapa').setAttribute('aria-label', qn.respondeu ? t('Mapa da {}, com o botão da nota aceso', maoNome(a.mao)) : t('Mapa da {}, com a zona da nota acesa', maoNome(a.mao)));
  $('#qnMapaLeg').textContent = `${t(a.mao==='left' ? 'Mão esquerda' : 'Mão direita')} · ${dirLabel(a.dir)}`;
}
// Onde mais a mesma nota aparece (o bandoneon é bissonoro: a mesma nota pode estar em outro botão ou na outra direção)
function qnOutrosLugares(a){
  const lugares = [];
  for(const mao of ['left', 'right']) for(const b of state.layout[mao]) for(const dir of ['open', 'close'])
    if(b[dir]===a.midi && !(b===a.b && dir===a.dir)) lugares.push(`${maoNome(mao)} (${dirLabel(dir).toLowerCase()})`);
  return [...new Set(lugares)];
}
function qnRenderDicas(){
  const a = qn.alvo, itens = [];
  if(a && qn.respondeu){
    itens.push(`<b>${t('Onde ela fica')}:</b> ${qnZonaTexto(a)}`);
    const outros = qnOutrosLugares(a);
    if(outros.length) itens.push(t('A mesma nota também sai em: {}.', outros.join(', ')));
  } else if(a){
    if(qn.dicas >= 1) itens.push(qnZonaTexto(a));
    if(qn.dicas >= 2) itens.push(qnRegistroTexto(a.midi) + (qnNivel()===3 ? ' ' + t(qnNatural(a.midi) ? 'É uma nota natural, sem sustenido.' : 'Tem sustenido.') : ''));
    if(qn.dicas >= 3) itens.push(t('Duas alternativas erradas foram riscadas.'));
  }
  $('#qnDicas').innerHTML = itens.map(x=>`<li>${x}</li>`).join('');
  $('#qnDicaTit').textContent = a && qn.respondeu ? t('Onde fica no bandoneon') : t('Dica');
  $('#qnDicaInfo').hidden = !!itens.length;
  qnMapa(); qnBotoes();
}
function qnDica(){
  if(!qn.ativo || !qn.alvo || qn.respondeu || qn.dicas >= 3) return;
  qn.dicas++;
  if(qn.dicas===3){
    qn.riscadas = qnEmbaralhar(qn.opcoes.filter(m=>m!==qn.alvo.midi)).slice(0, 2);
    $$('#qnOpcoes .qn-op').forEach(b=>{ if(qn.riscadas.includes(+b.dataset.m)){ b.classList.add('riscada'); b.disabled = true; } });
  }
  qnRenderDicas();
}

/* ---------- A rodada ---------- */
async function qnComecar(){
  ac(); contarUso('qualnota');
  const s = ++qn.sessao; qnLimparTimers();
  Object.assign(qn, {ativo:true, rodada:0, acertos:0, semDica:0, hist:[], alvo:null, respondeu:false, dicas:0});
  $('#qnFim').hidden = true; $('#qnPalco').hidden = false;
  qnBotoes(); qnBolinhas(); qnFeed(t('Preparando o som do bandoneon…'));
  await Promise.race([carregarSons(), new Promise(r=>setTimeout(r, 2500))]);
  if(s===qn.sessao && qn.ativo) qnPergunta();
}
function qnPergunta(){
  qnLimparTimers();
  if(qn.rodada >= QN_RODADAS) return qnFim();
  const L = qnBanco(), alvo = qnSortear(L), {W, H} = qnLimites(alvo.mao);
  // o centro da zona fica perto do botão, mas não em cima dele: a dica aponta a região, não o botão
  const zona = {x:Math.max(0, Math.min(W, alvo.b.x + (Math.random() - .5) * 1.4)), y:Math.max(0, Math.min(H, alvo.b.y + (Math.random() - .5) * 1.2))};
  Object.assign(qn, {alvo, opcoes:qnAlternativas(alvo.midi, L), respondeu:false, dicas:0, riscadas:[], zona});
  qnRenderOpcoes(); qnRenderDicas(); qnBolinhas();
  $('#qnProxima').hidden = true;
  qnFeed(t('Escute e escolha a nota.'));
  if($('#qnRef').checked) qnAbrirRef(); else qnDepois(250, qnTocar);
}
function qnResponder(m){
  if(!qn.ativo || !qn.alvo || qn.respondeu || qn.riscadas.includes(m)) return;
  qn.respondeu = true; qnLimparTimers();
  const a = qn.alvo, certo = m===a.midi, notas = qnProg().notas, s = notas[a.midi] = notas[a.midi] || {ok:0, err:0};
  certo ? s.ok++ : s.err++; saveProgress();
  qn.hist.push({midi:a.midi, certo, dica:qn.dicas > 0, marcou:m});
  if(certo){ qn.acertos++; if(!qn.dicas) qn.semDica++; }
  $$('#qnOpcoes .qn-op').forEach(b=>{ const v = +b.dataset.m; b.disabled = true;
    b.classList.toggle('certa', v===a.midi); b.classList.toggle('errada', v===m && !certo); });
  vibrar(certo ? 'ok' : 'erro');
  if(certo) qnFeed(qn.dicas ? t('Certo, com dica: é {}.', noteName(a.midi)) : t('Certo! É {}.', noteName(a.midi)), 'ok');
  else {
    qnFeed(t(m < a.midi ? 'Você marcou {}. A certa é {}, mais aguda.' : 'Você marcou {}. A certa é {}, mais grave.', noteName(m), noteName(a.midi)), 'bad');
    // toca a que você marcou e depois a certa, para comparar
    const c = ac(); playNote(m, 0.7, a.mao, c.currentTime + 0.1); playNote(a.midi, 1.1, a.mao, c.currentTime + 1.05); qnOnda(1.05, 1.1);
  }
  qnRotulo(qnRotuloResposta());
  qn.rodada++; qnBolinhas(); qnRenderDicas();
  $('#qnProximaTxt').textContent = qn.rodada >= QN_RODADAS ? t('Ver o resultado') : t('Próxima nota');
  $('#qnProxima').hidden = false;
  requestAnimationFrame(()=>$('#qnProxima').focus({preventScroll:true}));
}
function qnFim(){
  qn.ativo = false; qnLimparTimers(); qn.esperaRef = false; if($('#qnRefDlg').open) $('#qnRefDlg').close();
  const p = qnProg(), recorde = qn.semDica > 0 && (p.melhor==null || qn.semDica > p.melhor);
  if(p.melhor==null || qn.semDica > p.melhor){ p.melhor = qn.semDica; saveProgress(); }
  logPractice('desafio');
  $('#qnPalco').hidden = true; $('#qnFim').hidden = false;
  const n = qn.acertos;
  $('#qnFimTit').textContent = t(n >= 9 ? 'Ouvido de ouro!' : n >= 7 ? 'Muito bem!' : n >= 5 ? 'Bom treino!' : 'O ouvido melhora com a prática.');
  $('#qnFimN').textContent = n;
  $('#qnFimSem').textContent = t('{} sem dica', qn.semDica);
  $('#qnRecordeNovo').hidden = !recorde;
  const erradas = [...new Set(qn.hist.filter(h=>!h.certo).map(h=>h.midi))];
  $('#qnTreinarBox').hidden = !erradas.length;
  $('#qnTreinar').innerHTML = erradas.map(m=>`<button type="button" class="qn-chip" data-ouvir="${m}"><svg aria-hidden="true"><use href="#i-volume"/></svg><span translate="no">${noteName(m)}</span></button>`).join('');
  qnRecorde(); qnBotoes();
  contarNumeros($('#qnFim'), '.qn-fim-n b');
  if(n >= 8) comemorar();
}
function qnRecorde(){
  const m = qnProg().melhor;
  $('#qnRecorde').textContent = m==null ? t('Dez perguntas por rodada. Repetir o som não custa nada.') : t('Seu recorde: {} de 10 sem dica.', m);
}
function qnSair(){ qnLimparTimers(); qn.esperaRef = false; if($('#qnRefDlg').open) $('#qnRefDlg').close(); if(qnRaf){ cancelAnimationFrame(qnRaf); qnRaf = 0; } }

/* ---------- Ligações ---------- */
$('#qnComecar').onclick = qnComecar;
$('#qnRepetir').onclick = qnRepetir;
$('#qnOnda').onclick = qnRepetir;
$('#qnOuvirDo').onclick = qnOuvirDo;
$('#qnDicaBtn').onclick = qnDica;
$('#qnRefSeguir').onclick = ()=>qnFecharRef(false);
$('#qnRefDeNovo').onclick = qnTocarDo;
$('#qnRefSem').onclick = ()=>qnFecharRef(true);
$('#qnRefDlg').addEventListener('close', qnRefFechou); // o Esc também fecha
// a escolha do Dó fica guardada (ligada por padrão)
$('#qnRef').checked = store.get('qualnotaRef', true) !== false;
$('#qnRef').onchange = ()=>store.set('qualnotaRef', $('#qnRef').checked);
$('#qnProxima').onclick = ()=>{ if(qn.ativo && qn.respondeu) qnPergunta(); };
$('#qnDeNovo').onclick = qnComecar;
$('#qnMudar').onclick = ()=>{ $('#qnFim').hidden = true; $('#qnPalco').hidden = false; qn.alvo = null; qnRenderOpcoes(); qnRenderDicas(); qnBolinhas();
  qnRotulo(t('Toque em Começar quiz')); qnFeed(''); const b = $('#qnMenu .menu-seg button.on'); if(b) b.focus(); };
// "Parar": encerra o quiz e volta ao menu
function qnParar(){
  qn.sessao++; qnSair(); Object.assign(qn, {ativo:false, alvo:null, respondeu:false, dicas:0, riscadas:[], hist:[], rodada:0, acertos:0, semDica:0});
  $('#qnFim').hidden = true; $('#qnPalco').hidden = false; $('#qnProxima').hidden = true;
  qnRenderOpcoes(); qnRenderDicas(); qnBolinhas(); qnRotulo(t('Toque em Começar quiz')); qnFeed('');
}
$('#qnParar').onclick = qnParar;
segmentar($('#qnMao')); segmentar($('#qnNivel'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'});
$('#qnOpcoes').addEventListener('click', e=>{ const b = e.target.closest('.qn-op'); if(b && b.dataset.m!=='') qnResponder(+b.dataset.m); });
$('#qnTreinar').addEventListener('click', e=>{ const b = e.target.closest('[data-ouvir]'); if(b){ playNote(+b.dataset.ouvir, 1.1); } });
// Teclado do computador: 1 a 4 respondem, Espaço ou R repete, D pede dica, Enter vai para a próxima
document.addEventListener('keydown', e=>{
  if(currentView!=='qualnota' || e.ctrlKey || e.metaKey || e.altKey) return;
  if(['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || document.querySelector('dialog[open]')) return;
  const emBotao = e.target.closest && e.target.closest('button');
  if(/^[1-4]$/.test(e.key) && qn.ativo && qn.alvo && !qn.respondeu){ e.preventDefault(); qnResponder(qn.opcoes[+e.key - 1]); }
  else if((e.code==='Space' && !emBotao) || e.code==='KeyR'){ if(qn.ativo && qn.alvo){ e.preventDefault(); if(!e.repeat) qnRepetir(); } }
  else if(e.code==='KeyD' && qn.ativo){ e.preventDefault(); qnDica(); }
  else if(e.key==='Enter' && !emBotao && qn.ativo && qn.respondeu){ e.preventDefault(); qnPergunta(); }
});
window.addEventListener('resize', ()=>{ if(currentView==='qualnota' && !qnRaf) qnDesenhar(qnUlt, qnUltPico, true); });
ganchosAba.push((v, anterior)=>{
  if(anterior==='qualnota' && v!=='qualnota'){ qnSair(); if(eq.active) pararEar(); }
  if(v==='qualnota'){ qnRecorde(); requestAnimationFrame(()=>qnDesenhar(qnUlt, qnUltPico, true)); }
});
qnRenderOpcoes(); qnBolinhas(); qnRecorde();
// Aba Ouvido: dois modos. "Qual é a nota?" (este quiz) e "Ache pelo som" (js/ouvido.js). Trocar de modo encerra o que rodava.
function ouvidoModo(m){
  $$('[data-ouv]').forEach(b=>{ const on = b.dataset.ouv===m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  $('#ouvNome').hidden = m!=='nome'; $('#ouvSom').hidden = m!=='som';
  if(m!=='nome' && qn.ativo) qnParar();
  if(m!=='som' && eq.active) pararEar();
  if(m==='nome') requestAnimationFrame(()=>qnDesenhar(qnUlt, qnUltPico, true));
  construirPendentes(); store.set('ouvidoModo', m);
}
$$('[data-ouv]').forEach(b=>b.onclick = ()=>ouvidoModo(b.dataset.ouv));
ouvidoModo(store.get('ouvidoModo', 'nome')==='som' ? 'som' : 'nome');
