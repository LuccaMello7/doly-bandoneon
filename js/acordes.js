/* ================== Acordes ================== */
const CHORD_TYPES = {
  maior:{name:'Maior',              suf:'',     iv:[0,4,7],    deg:['1','3','5']},
  menor:{name:'Menor',              suf:'m',    iv:[0,3,7],    deg:['1','♭3','5']},
  dom7: {name:'Sétima (dominante)', suf:'7',    iv:[0,4,7,10], deg:['1','3','5','♭7']},
  m7:   {name:'Menor com sétima',   suf:'m7',   iv:[0,3,7,10], deg:['1','♭3','5','♭7']},
  m6:   {name:'Menor com sexta',    suf:'m6',   iv:[0,3,7,9],  deg:['1','♭3','5','6']},
  dim7: {name:'Diminuto',           suf:'°7',   iv:[0,3,6,9],  deg:['1','♭3','♭5','𝄫7']},
};
const ROOT_PT = ['Dó','Dó♯','Ré','Mi♭','Mi','Fá','Fá♯','Sol','Lá♭','Lá','Si♭','Si'];
const ROOT_EN = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const ROOT_ES = ['Do','Do♯','Re','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'];
const rootName = pc => (state.names==='en' ? ROOT_EN : state.lang==='es' ? ROOT_ES : ROOT_PT)[pc];
const chordName = (pc, type) => rootName(pc) + CHORD_TYPES[type].suf;
const MAX_SPREAD = 3.3; // distância máxima entre botões (em "botões") para caber na mão

// Procura combinações de botões (uma por nota do acorde) na direção pedida
function chordVoicings(hand, dir, pc, type){
  const T = CHORD_TYPES[type], pcs = T.iv.map(i=>(pc+i)%12), L = state.layout[hand];
  const byPc = pcs.map(p=>L.filter(b=>((b[dir]%12)+12)%12===p));
  const sets = pcs.length===4 ? [[0,1,2,3],[0,1,3]] : [[0,1,2]]; // 7ª sem a 5ª também vale
  const out = [], seen = new Set();
  for(const req of sets){
    const lists = req.map(k=>byPc[k]);
    if(lists.some(l=>!l.length)) continue;
    const walk = (k, acc)=>{
      if(k===lists.length){
        let spread = 0;
        for(let i=0;i<acc.length;i++) for(let j=i+1;j<acc.length;j++) spread = Math.max(spread, Math.hypot(acc[i].x-acc[j].x, acc[i].y-acc[j].y));
        if(spread > MAX_SPREAD) return;
        const ms = acc.map(b=>b[dir]), low = Math.min(...ms), span = Math.max(...ms)-low;
        if(span > 24) return;
        const key = acc.map(b=>b.id).sort().join();
        if(seen.has(key)) return; seen.add(key);
        // pontuação (menor = melhor): distância entre botões + extensão em oitavas
        // + penalidade se o baixo não for a tônica ou se faltar a 5ª
        const rootBass = ((low%12)+12)%12===pc, omit5 = req.length<pcs.length;
        out.push({btns:[...acc], degrees:req.map(r=>T.deg[r]), rootBass, omit5,
                  score: spread + span/12*0.8 + (rootBass?0:1.5) + (omit5?1:0)});
        return;
      }
      for(const b of lists[k]) if(!acc.includes(b)) walk(k+1, [...acc, b]);
    };
    walk(0, []);
  }
  return out.sort((a,b)=>a.score-b.score).slice(0,4);
}

const ch = {dir:'open', hand:'left', voicings:[], sel:0, training:false, round:0, score:0, target:null, picked:new Set()};
const chOpts = hand => ({perRow:1, getDir:()=>ch.dir, onPress:(b,m)=>chordPress(b,m)});
const ckL = kb($('#ckLeft'),'left',chOpts('left')), ckR = kb($('#ckRight'),'right',chOpts('right'));
const chKb = () => ch.hand==='left' ? ckL : ckR;

function fillChordSelects(){
  const r=$('#chRoot').value||'9', t=$('#chType').value||'menor';
  $('#chRoot').innerHTML = Array.from({length:12},(_,pc)=>`<option value="${pc}">${rootName(pc)}</option>`).join('');
  $('#chType').innerHTML = Object.entries(CHORD_TYPES).map(([k,T])=>`<option value="${k}">${T.name}${T.suf?` (${T.suf})`:''}</option>`).join('');
  $('#chRoot').value=r; $('#chType').value=t;
}
function showChord(){
  if(ch.training) return;
  const pc=+$('#chRoot').value, type=$('#chType').value;
  ch.hand=$('#chHand').value; ch.dir=$('#chDir').value;
  $('#ckLeftWrap').style.display = ch.hand==='left'?'flex':'none';
  $('#ckRightWrap').style.display = ch.hand==='right'?'flex':'none';
  ckL.refresh(); ckR.refresh();
  const T=CHORD_TYPES[type];
  $('#chTitle').textContent = `${chordName(pc,type)} · ${dirLabel(ch.dir).toLowerCase()}`;
  $('#chNotes').textContent = 'Notas: ' + T.iv.map((iv,i)=>`${rootName((pc+iv)%12)} (${T.deg[i]})`).join(' · ');
  ch.voicings = chordVoicings(ch.hand, ch.dir, pc, type); ch.sel = 0;
  $('#chVoicings').innerHTML = ch.voicings.length
    ? ch.voicings.map((v,i)=>`<button class="btn sec voicing ${i===0?'on':''}" data-i="${i}">Opção ${i+1}: ${v.btns.map(b=>noteName(b[ch.dir])).join(' · ')}${v.rootBass?'':' <small>(inversão)</small>'}${v.omit5?' <small>(sem a 5ª)</small>':''}</button>`).join('')
    : `<p class="muted">Não encontrei uma forma confortável deste acorde ${dirLabel(ch.dir).toLowerCase()} na mão ${ch.hand==='left'?'esquerda':'direita'}. Tente a outra direção do fole.</p>`;
  markVoicing();
}
function markVoicing(){
  const k=chKb(); ckL.clearMarks(); ckR.clearMarks();
  const v=ch.voicings[ch.sel]; if(!v) return;
  v.btns.forEach(b=>k.mark(b.id,'chord',0));
}
function playChord(arp){
  const v=ch.voicings[ch.sel]; if(!v) return; ac();
  const ms=v.btns.map(b=>b[ch.dir]).sort((a,b)=>a-b);
  ms.forEach((m,i)=>playNote(m, arp?0.5:1.4, ch.hand, AC.currentTime+(arp?i*0.22:0), 0.12));
}
$('#chVoicings').addEventListener('click', e=>{ const b=e.target.closest('.voicing'); if(!b) return;
  ch.sel=+b.dataset.i; $$('#chVoicings .voicing').forEach(x=>x.classList.toggle('on',x===b)); markVoicing(); playChord(false); });
['#chRoot','#chType','#chHand','#chDir'].forEach(id=>$(id).onchange=showChord);
$('#chPlay').onclick=()=>playChord(false);
$('#chArp').onclick=()=>playChord(true);

// ---------- Treino ----------
function chordPress(b){
  if(!ch.training) return;
  const k=chKb();
  if(ch.picked.has(b.id)){ ch.picked.delete(b.id); k.unmark(b.id,'chord'); }
  else { ch.picked.add(b.id); k.mark(b.id,'chord',0); }
  chBotoesOuvir();
}
function nextChordRound(){
  ckL.clearMarks(); ckR.clearMarks(); ch.picked.clear(); chBotoesOuvir();
  if(ch.round>=10){
    ch.training=false; $('#chTrainBox').style.display='none'; $('#chExplore').style.display='block';
    $('#chFeed').className='feedback'; $('#chFeed').textContent=`Fim do treino: ${ch.score}/10`;
    if(state.progress.chords==null || ch.score>state.progress.chords){ state.progress.chords=ch.score; saveProgress(); }
    if(ch.score>=8) comemorar();
    logPractice('acordes');
    showChord(); return;
  }
  const types=$$('#chTrainTypes input:checked').map(i=>i.value); if(!types.length) types.push('maior','menor');
  let pc, type, dir, vs;
  do{ pc=rand(12); type=pick(types); dir=pick(['open','close']); vs=chordVoicings(ch.hand,dir,pc,type); }while(!vs.length);
  Object.assign(ch, {target:{pc,type,vs}, dir, relSel:0, relVer:false}); ckL.refresh(); ckR.refresh(); chRelembre();
  $('#chTarget').textContent = chordName(pc,type);
  const p=$('#chTrainDir'); p.className='dirpill '+dir; p.textContent=`${dirLabel(dir)} · mão ${ch.hand==='left'?'esquerda':'direita'}`;
  $('#chScore').textContent=`Rodada ${ch.round+1}/10 · Acertos: ${ch.score}`;
}
$('#chCheck').onclick=()=>{
  if(!ch.training) return;
  const {pc,type,vs}=ch.target, L=state.layout[ch.hand], T=CHORD_TYPES[type];
  const picked=[...ch.picked].map(id=>L.find(b=>b.id===id));
  const pcs=new Set(picked.map(b=>((b[ch.dir]%12)+12)%12));
  // Certo = tem fundamental, 3ª e última nota do acorde (a 5ª é opcional nas tétrades) e nenhuma
  // nota estranha. Dobrar notas vale.
  const need=new Set(T.iv.map(i=>(pc+i)%12)), core=new Set([0,1,T.iv.length-1].map(k=>(pc+T.iv[k])%12));
  const extra=[...pcs].filter(p=>!need.has(p)), missing=[...core].filter(p=>!pcs.has(p));
  const k=chKb();
  if(picked.length && !extra.length && !missing.length){
    ch.score++; $('#chFeed').className='feedback ok'; $('#chFeed').textContent='Certo!';
    picked.forEach(b=>k.mark(b.id,'ok',800));
  } else {
    $('#chFeed').className='feedback bad';
    $('#chFeed').textContent = extra.length ? `Sobrou: ${extra.map(rootName).join(', ')}. Veja uma forma correta.` : `Faltou: ${missing.map(rootName).join(', ')}. Veja uma forma correta.`;
    vs[0].btns.forEach(b=>k.mark(b.id,'hint',1400));
  }
  ac(); picked.forEach((b,i)=>playNote(b[ch.dir],1,ch.hand,AC.currentTime,0.1));
  ch.round++; setTimeout(nextChordRound, 1500);
};
$('#chTrain').onclick=()=>{
  ac(); ch.hand=$('#chHand').value;
  Object.assign(ch,{training:true, round:0, score:0});
  $('#chExplore').style.display='none'; $('#chTrainBox').style.display='block'; $('#chFeed').textContent='';
  $('#ckLeftWrap').style.display = ch.hand==='left'?'flex':'none';
  $('#ckRightWrap').style.display = ch.hand==='right'?'flex':'none';
  nextChordRound();
};
$('#chStop').onclick=()=>{ ch.training=false; $('#chTrainBox').style.display='none'; $('#chExplore').style.display='block'; $('#chFeed').textContent=''; showChord(); };
fillChordSelects(); showChord();
// O menu: tônica, tipo, mão e fole viram botões lado a lado (js/menus.js). Durante o treino, uma barra de resumo com "Parar treino"
segmentar($('#chRoot'), {classe:'menu-seg-notas'}); segmentar($('#chType'), {rotulo:rotuloSimbolo, classe:'menu-seg-tipos'});
segmentar($('#chHand')); segmentar($('#chDir'), {rotulo:rotuloFole});
$('#chTrain').addEventListener('click', ()=>{
  const mao = $('#chHand').options[$('#chHand').selectedIndex];
  const tipos = $$('#chTrainTypes input:checked').map(i=>i.nextElementSibling.textContent.trim()).join(', ') || t('Maior') + ', ' + t('Menor');
  $('#chResumoChips').innerHTML = menuChips([[t('Mão'), mao ? mao.textContent.trim() : ''], [t('Tipos'), tipos]]);
});

// ---------- Relembre: o mapa do acorde pedido, durante o treino ----------
// Os botões da forma mais compacta (a mesma que o app mostra ao explorar), na cor do fole e com o nome da nota.
// "Mostrar sempre" ligado (padrão): o mapa aparece em toda rodada; desligado, aparece só se o aluno pedir.
const chMapaLigado = () => store.get('acordesMapa', true) !== false;
function chRelembre(){
  if(!ch.target) return;
  const {pc, type, vs} = ch.target, dir = ch.dir, mostrar = chMapaLigado() || ch.relVer;
  $('#chRelTit').textContent = `${chordName(pc, type)} · ${dirLabel(dir).toLowerCase()}`;
  $('#chRelCorpo').hidden = !mostrar; $('#chRelVer').hidden = mostrar;
  if(!mostrar) return;
  const v = vs[ch.relSel % vs.length], L = state.layout[ch.hand], noAcorde = new Set(v.btns.map(b=>b.id));
  const W = Math.max(...L.map(b=>b.x)), H = Math.max(...L.map(b=>b.y)), svg = $('#chRelMapa');
  svg.setAttribute('viewBox', `-0.15 -0.15 ${W + 1.3} ${H + 1.3}`);
  svg.setAttribute('aria-label', t('Mapa da {} com os botões do acorde', maoNome(ch.hand)));
  svg.innerHTML = L.map(b=>{
    const on = noAcorde.has(b.id), x = (b.x + .5).toFixed(2), y = (b.y + .5).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r=".42" class="${on ? 'on ' + dir : ''}"/>`
      + (on ? `<text x="${x}" y="${y}">${rootName(((b[dir] % 12) + 12) % 12)}</text>` : '');
  }).join('');
  $('#chRelNotas').textContent = t('Notas: {}', CHORD_TYPES[type].iv.map(i=>rootName((pc + i) % 12)).join(' · '));
  $('#chRelPos').textContent = vs.length > 1 ? t('Posição {} de {}', ch.relSel % vs.length + 1, vs.length) : '';
  $('#chRelOutra').hidden = vs.length < 2;
}
$('#chRelOutra').onclick = ()=>{ ch.relSel++; chRelembre(); };
$('#chRelVer').onclick = ()=>{ ch.relVer = true; chRelembre(); };
$('#chRelOn').checked = chMapaLigado();
$('#chRelOn').onchange = ()=>{ store.set('acordesMapa', $('#chRelOn').checked); ch.relVer = false; chRelembre(); };

// ---------- Ouvir os botões marcados, antes de conferir ----------
// Juntas (o acorde) ou em arpejo, da nota mais grave para a mais aguda: se soar estranho, algo está errado
function chBotoesOuvir(){ const vazio = !ch.picked.size; $('#chOuvirSel').disabled = vazio; $('#chArpSel').disabled = vazio; }
function chTocarSelecionadas(arpejo){
  const L = state.layout[ch.hand], k = chKb();
  const sel = [...ch.picked].map(id=>L.find(b=>b.id===id)).filter(Boolean).sort((a, b)=>a[ch.dir] - b[ch.dir]);
  if(!sel.length) return;
  ac(); const t0 = AC.currentTime + 0.03, passo = 0.34;
  sel.forEach((b, i)=>{
    playNote(b[ch.dir], arpejo ? 0.8 : 1.4, ch.hand, t0 + (arpejo ? i * passo : 0), 0.1);
    setTimeout(()=>k.mark(b.id, 'guia', arpejo ? 320 : 600), arpejo ? i * passo * 1000 : 0); // cada botão brilha quando soa
  });
}
$('#chOuvirSel').onclick = ()=>chTocarSelecionadas(false);
$('#chArpSel').onclick = ()=>chTocarSelecionadas(true);
