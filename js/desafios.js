/* ================== Desafio: Encontre a nota ================== */
// O app sorteia um botão e uma direção, mostra a nota e o aluno procura o botão.
// fq = estado da rodada (hand/dir sorteados, answer = botão certo, target = nota MIDI).
const fq={round:0,score:0,target:null,dir:'open',hand:'right',errors:0,active:false,answer:null,heat:false};
const fOpts=hand=>({ getDir:()=>fq.dir, showLabels:()=>fq.heat, sound:true, onPress:(b,m,dir,k)=>findPress(b,m,k) });
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
function nextFind(){
  fkL.clearMarks(); fkR.clearMarks();
  if(fq.round>=10){
    fq.active=false; $('#fTarget').textContent=`Fim! ${fq.score}/10`;
    $('#fFeed').className='feedback'; $('#fFeed').textContent = fq.score>=8?'Excelente!':fq.score>=5?'Bom trabalho, continue treinando.':'Treine mais no Teclado com os nomes visíveis.';
    if(state.progress.find==null || fq.score>state.progress.find){ state.progress.find=fq.score; saveProgress(); }
    logPractice('desafio'); if(fq.score>=8) comemorar();
    return;
  }
  const hs=$('#fHand').value, ds=$('#fDir').value;
  fq.hand = hs==='both'?pick(['left','right']):hs;
  fq.dir = ds==='rand'?pick(['open','close']):ds;
  fq.answer = pickFindTarget(fq.hand, fq.dir); fq.target=fq.answer[fq.dir]; fq.errors=0;
  fkL.setDim(fq.hand!=='left'); fkR.setDim(fq.hand!=='right'); refreshAll();
  showFindTarget();
}
function showFindTarget(){
  $('#fTarget').textContent=noteName(fq.target);
  const p=$('#fDirPill'); p.style.visibility='visible'; p.className='dirpill '+fq.dir;
  p.textContent=`${dirLabel(fq.dir)} · mão ${fq.hand==='left'?'esquerda':'direita'}`;
  $('#fScore').textContent=`Rodada ${fq.round+1}/10 · Acertos: ${fq.score}`;
}
// Só pontua o acerto na primeira tentativa; depois de 2 erros mostra o botão certo
function findPress(b,m,k){
  if(!fq.active) return;
  if(k.hand!==fq.hand){ $('#fFeed').className='feedback bad'; $('#fFeed').textContent='Essa nota está na outra mão.'; return; }
  if(m===fq.target){
    k.mark(b.id,'ok'); fq.score += fq.errors===0?1:0; fq.round++; recordFind(fq.errors===0);
    $('#fFeed').className='feedback ok'; $('#fFeed').textContent = fq.errors?'Achou! (não conta ponto por ter errado antes)':'Certo!';
    setTimeout(nextFind,700);
  } else {
    fq.errors++; k.mark(b.id,'bad');
    $('#fFeed').className='feedback bad'; $('#fFeed').textContent=`Esse é ${noteName(m)}. Tente de novo.`;
    if(fq.errors>=2) k.mark(fq.answer.id,'hint',0);
  }
}
$('#fStart').onclick=()=>{ ac(); if(fq.heat) toggleHeat(); Object.assign(fq,{round:0,score:0,active:true}); $('#fFeed').textContent=''; nextFind(); };
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
  if(fq.heat){ fq.active=false; $('#fTarget').textContent='Mapa de erros'; $('#fFeed').textContent=''; $('#fDirPill').style.visibility='hidden'; paintHeat(); }
  else { [fkL,fkR].forEach(k=>{ state.layout[k.hand].forEach(b=>k.tint(b.id,'')); k.refresh(); }); $('#fTarget').textContent='–'; }
}
$('#fHeat').onclick=toggleHeat;
$('#fDir').addEventListener('change', ()=>{ if(fq.heat) paintHeat(); });
$('#fListen').onclick=()=>{ if(fq.target!=null) playNote(fq.target,0.8,fq.hand); };

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
    sq.active=false; drawStaff(sq.clef,null);
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
  if(b.dataset.ch!=='ear') eq.active=false;
});
renderStaffAnswers(); drawStaff('treble',null);
