/* ================== Desafio: Encontre a nota ================== */
const fq={round:0,score:0,target:null,dir:'open',hand:'right',errors:0,active:false,answer:null};
const fOpts=hand=>({ getDir:()=>fq.dir, showLabels:()=>false, sound:true, onPress:(b,m,dir,k)=>findPress(b,m,k) });
const fkL=kb($('#fkLeft'),'left',fOpts('left')), fkR=kb($('#fkRight'),'right',fOpts('right'));
function nextFind(){
  fkL.clearMarks(); fkR.clearMarks();
  if(fq.round>=10){
    fq.active=false; $('#fTarget').textContent=`Fim! ${fq.score}/10`;
    $('#fFeed').className='feedback'; $('#fFeed').textContent = fq.score>=8?'Excelente!':fq.score>=5?'Bom trabalho, continue treinando.':'Treine mais no Teclado com os nomes visíveis.';
    if(state.progress.find==null || fq.score>state.progress.find){ state.progress.find=fq.score; saveProgress(); }
    return;
  }
  const hs=$('#fHand').value, ds=$('#fDir').value;
  fq.hand = hs==='both'?pick(['left','right']):hs;
  fq.dir = ds==='rand'?pick(['open','close']):ds;
  fq.answer = pick(state.layout[fq.hand]); fq.target=fq.answer[fq.dir]; fq.errors=0;
  fkL.setDim(fq.hand!=='left'); fkR.setDim(fq.hand!=='right'); refreshAll();
  showFindTarget();
}
function showFindTarget(){
  $('#fTarget').textContent=noteName(fq.target);
  const p=$('#fDirPill'); p.style.visibility='visible'; p.className='dirpill '+fq.dir;
  p.textContent=`${dirLabel(fq.dir)} · mão ${fq.hand==='left'?'esquerda':'direita'}`;
  $('#fScore').textContent=`Rodada ${fq.round+1}/10 · Acertos: ${fq.score}`;
}
function findPress(b,m,k){
  if(!fq.active) return;
  if(k.hand!==fq.hand){ $('#fFeed').className='feedback bad'; $('#fFeed').textContent='Essa nota está na outra mão.'; return; }
  if(m===fq.target){
    k.mark(b.id,'ok'); fq.score += fq.errors===0?1:0; fq.round++;
    $('#fFeed').className='feedback ok'; $('#fFeed').textContent = fq.errors?'Achou! (não conta ponto por ter errado antes)':'Certo!';
    setTimeout(nextFind,700);
  } else {
    fq.errors++; k.mark(b.id,'bad');
    $('#fFeed').className='feedback bad'; $('#fFeed').textContent=`Esse é ${noteName(m)}. Tente de novo.`;
    if(fq.errors>=2) k.mark(fq.answer.id,'hint',0);
  }
}
$('#fStart').onclick=()=>{ ac(); Object.assign(fq,{round:0,score:0,active:true}); $('#fFeed').textContent=''; nextFind(); };
$('#fListen').onclick=()=>{ if(fq.target!=null) playNote(fq.target,0.8,fq.hand); };

/* ================== Desafio: Pauta ================== */
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
  if(+l===right){ sq.score++; $('#sFeed').className='feedback ok'; $('#sFeed').textContent=`Certo! ${noteName(midi)}`; }
  else { $('#sFeed').className='feedback bad'; $('#sFeed').textContent=`Era ${noteName(midi)}.`; }
  sq.round++; setTimeout(nextStaff,900);
});
$('#sStart').onclick=()=>{ ac(); Object.assign(sq,{round:0,score:0,active:true}); $('#sFeed').textContent=''; nextStaff(); };
$$('[data-ch]').forEach(b=>b.onclick=()=>{
  $$('[data-ch]').forEach(x=>x.classList.toggle('on',x===b));
  $('#chFind').style.display=b.dataset.ch==='find'?'block':'none';
  $('#chStaff').style.display=b.dataset.ch==='staff'?'block':'none';
});
renderStaffAnswers(); drawStaff('treble',null);
