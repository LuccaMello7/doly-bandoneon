/* ================== Desafio: Encontre a nota ================== */
// O app sorteia um botão e uma direção, mostra e toca a nota, e o aluno procura o botão no teclado.
// fq = estado da rodada (hand/dir sorteados, answer = botão certo, target = nota MIDI). Cada rodada toca a nota
// sozinha; "Ouvir a nota" (ou tocar no cartão da nota) repete. Dica em dois passos: a região do botão acende no
// teclado, depois o próprio botão (também aparece sozinho depois de dois erros). Com erro ou dica, não conta ponto.
const fq={round:0,score:0,target:null,dir:'open',hand:'right',errors:0,dicas:0,active:false,resolvido:false,answer:null,heat:false,hist:[],timer:0};
// Durante a rodada o botão Começar de cada desafio vira "Recomeçar" e muda de cor; volta no fim ou ao trocar
function botoesDesafio(){
  [['#fStart',()=>fq.active], ['#sStart',()=>sq.active], ['#eStart',()=>typeof eq!=='undefined' && eq.active], ['#pStart',()=>typeof pq!=='undefined' && pq.active]]
    .forEach(([id, ativo])=>{ const b = $(id); if(!b) return; const sim = !!ativo(); botaoRodando(b, sim);
      const txt = [...b.childNodes].reverse().find(n=>n.nodeType===3 && n.nodeValue.trim()); if(txt) txt.nodeValue = sim ? 'Recomeçar' : 'Começar'; });
}
// durante a rodada, sem nomes nos botões: senão o desafio é só achar a palavra escrita
const fOpts=hand=>({ getDir:()=>fq.dir, showLabels:()=>fq.heat || (!fq.active && state.showLabels), sound:true, onPress:(b,m,dir,k)=>findPress(b,m,k) });
// Estatística por botão e direção: {ok, err}
state.progress.btnStats = state.progress.btnStats || {};
const statKey = (hand,id,dir) => `${hand}|${id}|${dir}`;
// Sorteio inteligente: botões que você mais erra (e os que ainda não viu) aparecem mais
function findWeight(hand, b, dir){
  const s = state.progress.btnStats[statKey(hand,b.id,dir)];
  return s ? 0.3 + 4*(s.err+0.5)/(s.ok+s.err+1) : 2;
}
function pickFindTarget(hand, dir){
  const L = state.layout[hand];
  if($('#fMode').value!=='smart') return pick(L);
  const w = L.map(b=>findWeight(hand,b,dir) * (b===fq.answer?0.1:1));
  let r = Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<L.length;i++){ r-=w[i]; if(r<=0) return L[i]; }
  return L[L.length-1];
}
function recordFind(ok){
  const k = statKey(fq.hand, fq.answer.id, fq.dir), s = state.progress.btnStats[k] = state.progress.btnStats[k] || {ok:0, err:0};
  ok ? s.ok++ : s.err++; saveProgress();
}
const fkL=kb($('#fkLeft'),'left',fOpts('left')), fkR=kb($('#fkRight'),'right',fOpts('right'));
const fTeclado = () => fq.hand==='left' ? fkL : fkR;
// No celular, durante a rodada, só aparece o teclado da mão em jogo (o outro empurrava o certo para fora da tela)
function fLados(emJogo){
  $('#fkLeft').closest('.side').classList.toggle('fora', emJogo && fq.hand!=='left');
  $('#fkRight').closest('.side').classList.toggle('fora', emJogo && fq.hand!=='right');
  construirPendentes();
}
function fFeed(msg, cls=''){ const f = $('#fFeed'); f.className = 'feedback ' + cls; f.textContent = msg; }
// Toca a nota da rodada, sozinha
function fOuvir(){
  if(fq.target==null || !fq.active) return;
  ac(); playNote(fq.target, 0.9, fq.hand); anelToque($('#fAlvo'));
}
// Placar: uma bolinha por rodada (cheia = de primeira; meia = com erro ou dica)
function fBolinhas(){
  $('#fBolinhas').innerHTML = Array.from({length:10}, (_, i)=>{
    const h = fq.hist[i];
    return `<i class="${h ? (h.limpo ? 'certa' : 'certa-dica') : i===fq.round && fq.active ? 'agora' : ''}"></i>`;
  }).join('');
  $('#fRodada').textContent = Math.min(10, fq.round + 1); $('#fAcertos').textContent = fq.score;
}
function fBotoes(){
  const jogo = fq.active && fq.target!=null;
  $('#fListen').disabled = !jogo; $('#fAlvo').disabled = !jogo;
  $('#fDica').disabled = !jogo || fq.resolvido || fq.dicas >= 2;
  $('#fDicaTxt').textContent = fq.dicas===0 ? t('Ver uma dica') : fq.dicas===1 ? t('Mostrar o botão') : t('Sem mais dicas');
}
function nextFind(){
  clearTimeout(fq.timer);
  fkL.clearMarks(); fkR.clearMarks();
  if(fq.round>=10) return fimFind();
  const hs=$('#fHand').value, ds=$('#fDir').value;
  fq.hand = hs==='both'?pick(['left','right']):hs;
  fq.dir = ds==='rand'?pick(['open','close']):ds;
  fq.answer = pickFindTarget(fq.hand, fq.dir); fq.target=fq.answer[fq.dir];
  Object.assign(fq, {errors:0, dicas:0, resolvido:false});
  fkL.setDim(fq.hand!=='left'); fkR.setDim(fq.hand!=='right'); refreshAll();
  showFindTarget(); fBolinhas(); fBotoes();
  fFeed(t('Escute e toque o botão que dá essa nota.'));
  // na primeira rodada, espera o som do bandoneon chegar (até 2 s); nas outras, toca logo
  const espera = fq.round===0 ? Promise.race([carregarSons(), new Promise(r=>setTimeout(r, 2000))]) : Promise.resolve();
  const rodada = fq.round, alvo = fq.target;
  espera.then(()=>{ fq.timer = setTimeout(()=>{ if(fq.active && fq.round===rodada && fq.target===alvo) fOuvir(); }, 250); });
}
function fimFind(){
  fq.active=false; refreshAll(); botoesDesafio(); fLados(false);
  $('#fAlvoRot').textContent = t('Fim da rodada'); $('#fTarget').textContent = `${fq.score}/10`; $('#fDirPill').style.visibility = 'hidden';
  fFeed(t(fq.score>=8?'Excelente!':fq.score>=5?'Bom trabalho, continue treinando.':'Treine mais no Teclado com os nomes visíveis.'), fq.score>=8 ? 'ok' : '');
  if(state.progress.find==null || fq.score>state.progress.find){ state.progress.find=fq.score; saveProgress(); }
  // as notas que precisaram de ajuda, para ouvir de novo
  const ajuda = [...new Set(fq.hist.filter(h=>!h.limpo).map(h=>h.midi))];
  $('#fTreinarBox').hidden = !ajuda.length;
  $('#fTreinar').innerHTML = ajuda.map(m=>`<button type="button" class="qn-chip" data-ouvir="${m}"><svg aria-hidden="true"><use href="#i-volume"/></svg><span translate="no">${noteName(m)}</span></button>`).join('');
  fBolinhas(); fBotoes();
  logPractice('desafio'); if(fq.score>=8) comemorar();
}
// Para o desafio e volta a tela ao começo (ao trocar de desafio, sair da aba ou abrir o mapa de erros)
function pararFind(){
  clearTimeout(fq.timer); Object.assign(fq, {active:false, target:null, resolvido:false});
  fkL.clearMarks(); fkR.clearMarks(); fkL.setDim(false); fkR.setDim(false); refreshAll(); botoesDesafio(); fLados(false);
  $('#fHud').hidden = true; $('#fTreinarBox').hidden = true;
  $('#fAlvoRot').textContent = t('Toque em Começar'); $('#fTarget').textContent = '–'; $('#fDirPill').style.visibility = 'hidden';
  fFeed(''); fBotoes();
}
function showFindTarget(){
  $('#fHud').hidden = false; $('#fTreinarBox').hidden = true;
  $('#fAlvoRot').textContent = t('Encontre o botão de');
  $('#fTarget').textContent=noteName(fq.target); fLados(true);
  const p=$('#fDirPill'); p.style.visibility='visible'; p.className='dirpill '+fq.dir;
  p.textContent=`${dirLabel(fq.dir)} · ${maoNome(fq.hand)}`;
}
// Dica 1: acende a região do botão (o centro é sorteado perto dele, para não entregar qual é); dica 2: o próprio botão
function fMostrarZona(){
  const a = fq.answer, cx = a.x + (Math.random() - .5) * 1.2, cy = a.y + (Math.random() - .5) * 1.0;
  state.layout[fq.hand].filter(b=>Math.hypot(b.x - cx, b.y - cy) < 1.5).forEach(b=>fTeclado().mark(b.id, 'zona', 0));
  fFeed(t('O botão está na região acesa do teclado.'));
}
function fMostrarBotao(){ fq.dicas = 2; fTeclado().mark(fq.answer.id, 'hint', 0); fBotoes(); }
function fDica(){
  if(!fq.active || fq.resolvido || fq.dicas >= 2) return;
  fq.dicas++;
  if(fq.dicas===1) fMostrarZona(); else { fMostrarBotao(); fFeed(t('É o botão que está brilhando.')); }
  fBotoes();
}
// Só pontua o acerto de primeira e sem dica; depois de 2 erros mostra o botão certo
function findPress(b,m,k){
  if(!fq.active || fq.resolvido) return;
  if(k.hand!==fq.hand){ fFeed(t('Essa nota está na outra mão.'), 'bad'); return; }
  if(m===fq.target){
    const limpo = fq.errors===0 && fq.dicas===0;
    k.mark(b.id,'ok'); fq.resolvido = true; fq.score += limpo?1:0; fq.hist.push({midi:fq.target, limpo}); fq.round++; recordFind(limpo);
    fFeed(limpo ? t('Certo!') : t('Achou! Com ajuda, esta não conta ponto.'), 'ok');
    fBolinhas(); fBotoes();
    fq.timer = setTimeout(nextFind, 1100); // dá tempo de ouvir o botão certo antes da próxima nota
  } else {
    fq.errors++; k.mark(b.id,'bad');
    fFeed(t(m < fq.target ? 'Esse é {}. A nota que você procura é mais aguda.' : 'Esse é {}. A nota que você procura é mais grave.', noteName(m)), 'bad');
    if(fq.errors>=2 && fq.dicas<2) fMostrarBotao();
  }
}
$('#fStart').onclick=()=>{
  ac(); if(fq.heat) toggleHeat();
  Object.assign(fq,{round:0,score:0,active:true,hist:[]}); nextFind();
  // no celular, a nota e o teclado ficam à vista
  if(window.innerWidth < 900) $('#fPalco').scrollIntoView({block:'start', behavior: movReduzido() ? 'auto' : 'smooth'});
};
// Mapa de erros: pinta cada botão de verde (acerta) a vermelho (erra)
function paintHeat(){
  const dir = $('#fDir').value==='close' ? 'close' : 'open'; fq.dir = dir;
  for(const [k,hand] of [[fkL,'left'],[fkR,'right']]){
    k.setDim(false); k.refresh();
    for(const b of state.layout[hand]){
      const s = state.progress.btnStats[statKey(hand,b.id,dir)];
      k.tint(b.id, s ? `hsl(${Math.round(120*(1-s.err/(s.ok+s.err)))},60%,42%)` : '');
    }
  }
}
function toggleHeat(){
  fq.heat = !fq.heat; $('#fHeat').classList.toggle('on', fq.heat);
  $('#fHeatInfo').style.display = fq.heat ? 'block' : 'none';
  if(fq.heat){ pararFind(); $('#fAlvoRot').textContent = t('Mapa de erros'); paintHeat(); }
  else { [fkL,fkR].forEach(k=>{ state.layout[k.hand].forEach(b=>k.tint(b.id,'')); k.refresh(); }); $('#fAlvoRot').textContent = t('Toque em Começar'); }
}
$('#fHeat').onclick=toggleHeat;
$('#fDir').addEventListener('change', ()=>{ if(fq.heat) paintHeat(); });
$('#fListen').onclick=fOuvir;
$('#fAlvo').onclick=fOuvir;
$('#fDica').onclick=fDica;
$('#fTreinar').addEventListener('click', e=>{ const b = e.target.closest('[data-ouvir]'); if(b) playNote(+b.dataset.ouvir, 1.1); });
// Sair da aba Desafios para o Encontre a nota: ao voltar, começa do zero (não fica um "Recomeçar" perdido)
ganchosAba.push((v, anterior)=>{ if(anterior==='desafios' && v!=='desafios' && fq.active) pararFind(); });

/* ================== Desafio: Pauta ================== */
// Posição na pauta = índice diatônico d (oitava*7 + letra, Dó=0 … Si=6). A linha de baixo é
// Mi4 (d=30) na clave de sol e Sol2 (d=18) na clave de fá; cada passo de d sobe meia linha.
const sq={round:0,score:0,d:null,clef:'treble',active:false,locked:false};
const RANGES={treble:[27,41], bass:[15,29]}; // índices diatônicos (oitava*7+letra)
const dToMidi=d=>(Math.floor(d/7)+1)*12+DIA_SEMI[d%7];
function drawStaff(clef,d){
  const svg=$('#staffSvg'), bottom=clef==='treble'?30:18, Y=k=>100-(k-bottom)*6;
  let s='';
  for(let i=0;i<5;i++) s+=`<line x1="10" x2="310" y1="${100-i*12}" y2="${100-i*12}" stroke="#222" stroke-width="1.3"/>`;
  s+= clef==='treble'
    ? `<text x="14" y="110" font-size="72" font-family="Segoe UI Symbol,Noto Music,serif" fill="#222">𝄞</text>`
    : `<text x="16" y="90" font-size="50" font-family="Segoe UI Symbol,Noto Music,serif" fill="#222">𝄢</text>`;
  if(d!=null){
    const x=180, y=Y(d);
    // linhas suplementares abaixo e acima da pauta
    for(let k=bottom-2;k>=d;k-=2) s+=`<line x1="${x-14}" x2="${x+14}" y1="${Y(k)}" y2="${Y(k)}" stroke="#222" stroke-width="1.3"/>`;
    for(let k=bottom+10;k<=d;k+=2) s+=`<line x1="${x-14}" x2="${x+14}" y1="${Y(k)}" y2="${Y(k)}" stroke="#222" stroke-width="1.3"/>`;
    const up = d < bottom+4;
    s+=`<ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.5" transform="rotate(-20 ${x} ${y})" fill="#111"/>`;
    s+= up ? `<line x1="${x+7}" x2="${x+7}" y1="${y}" y2="${y-36}" stroke="#111" stroke-width="1.6"/>`
           : `<line x1="${x-7}" x2="${x-7}" y1="${y}" y2="${y+36}" stroke="#111" stroke-width="1.6"/>`;
  }
  svg.innerHTML=s;
}
function renderStaffAnswers(){
  $('#sAnswers').innerHTML = letterNames().map((n,i)=>`<button class="btn sec" data-l="${i}">${n}</button>`).join('');
}
function nextStaff(){
  if(sq.round>=10){
    sq.active=false; botoesDesafio(); drawStaff(sq.clef,null);
    $('#sFeed').className='feedback'; $('#sFeed').textContent=`Fim! ${sq.score}/10`;
    if(state.progress.staff==null || sq.score>state.progress.staff){ state.progress.staff=sq.score; saveProgress(); }
    logPractice('desafio'); if(sq.score>=8) comemorar();
    return;
  }
  const c=$('#sClef').value; sq.clef = c==='mix'?pick(['treble','bass']):c;
  const [a,b]=RANGES[sq.clef]; let d; do{ d=a+rand(b-a+1); }while(d===sq.d);
  sq.d=d; sq.locked=false; drawStaff(sq.clef,d);
  $('#sScore').textContent=`Rodada ${sq.round+1}/10 · Acertos: ${sq.score}`;
}
$('#sAnswers').addEventListener('click',e=>{
  const l=e.target.dataset.l; if(l==null||!sq.active||sq.locked) return;
  sq.locked=true; const right=sq.d%7, midi=dToMidi(sq.d);
  playNote(midi,0.6, sq.clef==='bass'?'left':'right');
  vibrar(+l===right?'ok':'erro');
  if(+l===right){ sq.score++; $('#sFeed').className='feedback ok'; $('#sFeed').textContent=`Certo! ${noteName(midi)}`; }
  else { $('#sFeed').className='feedback bad'; $('#sFeed').textContent=`Era ${noteName(midi)}.`; }
  sq.round++; setTimeout(nextStaff,900);
});
$('#sStart').onclick=()=>{ ac(); Object.assign(sq,{round:0,score:0,active:true}); $('#sFeed').textContent=''; nextStaff(); };
$$('[data-ch]').forEach(b=>b.onclick=()=>{
  $$('[data-ch]').forEach(x=>x.classList.toggle('on',x===b));
  $('#chFind').style.display=b.dataset.ch==='find'?'block':'none';
  $('#chStaff').style.display=b.dataset.ch==='staff'?'block':'none';
  $('#chEar').style.display=b.dataset.ch==='ear'?'block':'none';
  $('#chPauta').style.display=b.dataset.ch==='pautabot'?'block':'none';
  if(b.dataset.ch!=='pautabot' && typeof pq!=='undefined') pq.active=false;
  if(b.dataset.ch!=='find' && fq.active) pararFind();
  construirPendentes();
  if(b.dataset.ch!=='ear') eq.active=false;
});
renderStaffAnswers(); drawStaff('treble',null);
