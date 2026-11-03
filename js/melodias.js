/* ================== Melodias ================== */
const BUILTIN_MELODIES = [
{id:'esc-do', text:`título: Escala de Dó maior
mão: direita
bpm: 80
descrição: Suba e desça a escala devagar. Repare onde a sugestão troca a direção do fole.
Dó4:4 Ré4:4 Mi4:4 Fá4:4 | Sol4:4 Lá4:4 Si4:4 Dó5:4 | Si4:4 Lá4:4 Sol4:4 Fá4:4 | Mi4:4 Ré4:4 Dó4:2`},
{id:'esc-sol', text:`título: Escala de Sol maior
mão: direita
bpm: 80
descrição: Escala com um sustenido (Fá#).
Sol4:4 Lá4:4 Si4:4 Dó5:4 | Ré5:4 Mi5:4 Fá#5:4 Sol5:4 | Fá#5:4 Mi5:4 Ré5:4 Dó5:4 | Si4:4 Lá4:4 Sol4:2`},
{id:'esc-lam', text:`título: Lá menor harmônica
mão: direita
bpm: 72
descrição: A escala menor harmônica, com o Sol#, tem a cor de muitas melodias de tango.
Lá4:4 Si4:4 Dó5:4 Ré5:4 | Mi5:4 Fá5:4 Sol#5:4 Lá5:4 | Sol#5:4 Fá5:4 Mi5:4 Ré5:4 | Dó5:4 Si4:4 Lá4:2`},
{id:'cromatica', text:`título: Escala cromática (Lá3 a Lá4)
mão: direita
bpm: 66
descrição: Todos os semitons em sequência. Ótimo para memorizar o mapa nas duas direções.
Lá3:8 Lá#3:8 Si3:8 Dó4:8 Dó#4:8 Ré4:8 Ré#4:8 Mi4:8 | Fá4:8 Fá#4:8 Sol4:8 Sol#4:8 Lá4:2`},
{id:'arpejos', text:`título: Arpejos Dó, Lám, Fá, Sol
mão: direita
bpm: 70
descrição: Arpejos dos quatro acordes mais comuns em Dó maior e Lá menor.
Dó4:8 Mi4:8 Sol4:8 Dó5:8 Sol4:8 Mi4:8 Dó4:4 | Lá3:8 Dó4:8 Mi4:8 Lá4:8 Mi4:8 Dó4:8 Lá3:4 |
Fá4:8 Lá4:8 Dó5:8 Fá5:8 Dó5:8 Lá4:8 Fá4:4 | Sol4:8 Si4:8 Ré5:8 Sol5:8 Ré5:8 Si4:8 Sol4:4`},
{id:'estrelinha', text:`título: Brilha, brilha estrelinha
mão: direita
bpm: 90
descrição: Melodia tradicional, ótima para os primeiros passos.
Dó4 Dó4 Sol4 Sol4 | Lá4 Lá4 Sol4:2 | Fá4 Fá4 Mi4 Mi4 | Ré4 Ré4 Dó4:2 |
Sol4 Sol4 Fá4 Fá4 | Mi4 Mi4 Ré4:2 | Sol4 Sol4 Fá4 Fá4 | Mi4 Mi4 Ré4:2 |
Dó4 Dó4 Sol4 Sol4 | Lá4 Lá4 Sol4:2 | Fá4 Fá4 Mi4 Mi4 | Ré4 Ré4 Dó4:2`},
{id:'ode', text:`título: Ode à Alegria (Beethoven)
mão: direita
bpm: 90
descrição: Tema da 9ª Sinfonia, transposto para Dó maior.
Mi4 Mi4 Fá4 Sol4 | Sol4 Fá4 Mi4 Ré4 | Dó4 Dó4 Ré4 Mi4 | Mi4:4. Ré4:8 Ré4:2 |
Mi4 Mi4 Fá4 Sol4 | Sol4 Fá4 Mi4 Ré4 | Dó4 Dó4 Ré4 Mi4 | Ré4:4. Dó4:8 Dó4:2`},
{id:'esq-do', text:`título: Mão esquerda: escala de Dó maior
mão: esquerda
bpm: 72
descrição: A mesma escala, agora na região grave.
Dó3:4 Ré3:4 Mi3:4 Fá3:4 | Sol3:4 Lá3:4 Si3:4 Dó4:4 | Si3:4 Lá3:4 Sol3:4 Fá3:4 | Mi3:4 Ré3:4 Dó3:2`},
{id:'esq-baixos', text:`título: Mão esquerda: baixos em Lá menor
mão: esquerda
bpm: 76
descrição: Baixos de acompanhamento em marcato: Lám, Rém, Mi, Lám (fundamental e quinta).
Lá2 Mi3 Lá2 Mi3 | Ré3 Lá2 Ré3 Lá2 | Mi2 Si2 Mi2 Si2 | Lá2:2 p:2`},
];
const MEL_TEMPLATE = `título: Minha melodia
mão: direita
bpm: 80
descrição:
Dó4:4 Ré4:4 Mi4:4 p:4 | Mi4:4 Ré4:4 Dó4:2`;

state.progress.melodies = state.progress.melodies || {};
const mel = {cur:null, idx:-1, dir:'open', running:false, timers:[], raf:null, bus:null,
             errors:0, hits:0, events:[], upcoming:null, editingId:null};

function customMelodies(){ return store.get('melodies', []); }
function allMelodies(){ return BUILTIN_MELODIES.map(m=>({...m, builtin:true})).concat(customMelodies()); }

function parseMelody(text){
  const m = {title:'Sem título', desc:'', hand:'right', bpm:80, notes:[], bad:[]};
  for(const line of text.split('\n')){
    const h = line.match(/^\s*([^:\s]+)\s*:\s*(.*)$/);
    const key = h && h[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(h && ['titulo','mao','bpm','descricao'].includes(key)){
      const v=h[2].trim();
      if(key==='titulo') m.title=v||m.title;
      else if(key==='descricao') m.desc=v;
      else if(key==='bpm') m.bpm=Math.max(20,Math.min(240,parseInt(v)||80));
      else m.hand = /esq|left/i.test(v)?'left':'right';
      continue;
    }
    for(const tok of line.split(/\s+/).filter(Boolean)){
      if(tok==='|') continue;
      const t = tok.match(/^([^:\/~]+)(?::(\d+)(\.|t)?)?(?:\/([afAF]))?(~)?$/);
      if(!t){ m.bad.push(tok); continue; }
      const div = t[2]?parseInt(t[2]):4;
      if(![1,2,4,8,16,32].includes(div)){ m.bad.push(tok); continue; }
      const beats = 4/div*(t[3]==='.'?1.5:t[3]==='t'?2/3:1);
      if(/^p(ausa)?$/i.test(t[1])){ m.notes.push({rest:true, beats}); continue; }
      const midi = parseNote(t[1]);
      if(midi==null){ m.bad.push(tok); continue; }
      const last = m.notes[m.notes.length-1];
      if(last && last.tie && !last.rest && last.midi===midi){ last.beats+=beats; last.tie=!!t[5]; continue; }
      m.notes.push({midi, beats, force: t[4] ? (t[4].toLowerCase()==='a'?'open':'close') : null, tie:!!t[5]});
    }
  }
  return m;
}

// Escolhe a direção do fole para cada nota minimizando trocas de direção,
// sem deixar o fole andar mais que BELLOWS_SEC segundos na mesma direção.
const BELLOWS_SEC = 6;
function fingerMelody(m){
  const L = state.layout[m.hand], spb = 60/m.bpm;
  let states = [{dir:null, run:0, cost:0, prev:null}], restBefore=false;
  const playable = [];
  for(const n of m.notes){
    n.error=false; n.dir=null; n.btn=null;
    if(n.rest){ restBefore=true; continue; }
    const dirs = ['open','close'].filter(d=>(!n.force||n.force===d) && L.some(b=>b[d]===n.midi));
    if(!dirs.length){ n.error=true; continue; }
    const next = new Map();
    for(const s of states) for(const d of dirs){
      const same = s.dir===d, run = (same?s.run:0) + n.beats*spb;
      const cost = s.cost + (s.dir && !same ? (restBefore?0.3:1) : 0) + (run>BELLOWS_SEC?20:0) + (!s.dir && d==='close'?0.01:0);
      const key = d+'|'+run.toFixed(2), ex = next.get(key);
      if(!ex || cost<ex.cost) next.set(key, {dir:d, run, cost, prev:s});
    }
    // mantém só estados não dominados (menos fole usado OU menor custo)
    states = [];
    for(const d of ['open','close']){
      let bestCost = Infinity;
      [...next.values()].filter(x=>x.dir===d).sort((a,b)=>a.run-b.run||a.cost-b.cost)
        .forEach(x=>{ if(x.cost<bestCost-1e-9){ states.push(x); bestCost=x.cost; } });
    }
    restBefore=false; playable.push(n);
  }
  if(!playable.length) return;
  const best = states.reduce((a,b)=>b.cost<a.cost?b:a), path=[];
  for(let st=best; st && st.dir; st=st.prev) path.unshift(st.dir);
  best.path = path;
  let prev = null;
  playable.forEach((n,i)=>{
    n.dir = best.path[i];
    const cands = L.filter(b=>b[n.dir]===n.midi);
    n.btn = prev ? cands.reduce((a,b)=>Math.hypot(b.x-prev.x,b.y-prev.y)<Math.hypot(a.x-prev.x,a.y-prev.y)?b:a) : cands[0];
    prev = n.btn;
  });
}

const mkOpts = {getDir:()=>mel.dir, onPress:(b,m,dir)=>melPress(b,m,dir)};
const mkL = kb($('#mkLeft'),'left',mkOpts), mkR = kb($('#mkRight'),'right',mkOpts);
const melKb = () => mel.cur && mel.cur.hand==='left' ? mkL : mkR;
const melSpeed = () => +$('#melSpeed').value/100;
const playableNotes = () => mel.cur.notes.filter(n=>!n.rest && !n.error);

function setMelDir(d){
  mel.dir = d; const p=$('#melDirPill');
  p.className='dirpill '+d; p.textContent = d==='open'?'⟵ ABRINDO ⟶':'⟶ FECHANDO ⟵';
  mkL.refresh(); mkR.refresh(); mkL.retune(); mkR.retune();
}
function melFeed(msg, cls=''){ const f=$('#melFeed'); f.className='feedback '+cls; f.textContent=msg; }
function cardEl(i){ return $(`#melStrip .mcard[data-i="${i}"]`); }
function markCur(i){ $$('#melStrip .mcard').forEach(c=>c.classList.toggle('cur', +c.dataset.i===i)); }
function cardCls(i, cls){ const c=cardEl(i); if(!c) return; c.classList.remove('ok','bad'); c.classList.add(cls); }
function hintBtn(n){ const k=melKb(); k.clearMarks(); if(n && n.btn) k.mark(n.btn.id,'hint',0); }

function renderMelList(){
  const cur = mel.cur && mel.cur.id;
  $('#melList').innerHTML = allMelodies().map(x=>{
    const t = parseMelody(x.text), best = state.progress.melodies[x.id];
    return `<button data-id="${x.id}" class="${x.id===cur?'active':''}">${t.title}${best!=null?`<span class="best">${best}%</span>`:''}${x.builtin?'':' <span class="muted">(sua)</span>'}</button>`;
  }).join('');
}
$('#melList').addEventListener('click', e=>{ const b=e.target.closest('button'); if(b) loadMelody(b.dataset.id); });

function loadMelody(id){
  stopMelody();
  const src = allMelodies().find(x=>x.id===id) || allMelodies()[0];
  const m = parseMelody(src.text);
  Object.assign(m, {id:src.id, builtin:!!src.builtin, text:src.text});
  fingerMelody(m); mel.cur = m;
  $('#melEditor').style.display='none'; $('#melPlayer').style.display='block';
  renderMelList(); renderMelPlayer();
}
function onLayoutChange(){ if(mel.cur){ stopMelody(); fingerMelody(mel.cur); renderMelPlayer(); } }

function renderMelPlayer(){
  const m = mel.cur;
  $('#melTitle').textContent = m.title;
  $('#melDesc').textContent = `${m.desc ? m.desc+' · ' : ''}Mão ${m.hand==='left'?'esquerda':'direita'} · ${m.bpm} BPM`;
  $('#mkLeftWrap').style.display = m.hand==='left'?'flex':'none';
  $('#mkRightWrap').style.display = m.hand==='right'?'flex':'none';
  $('#melStrip').innerHTML = m.notes.map((n,i)=> n.rest
    ? `<div class="mcard rest" data-i="${i}" style="width:${34+n.beats*18}px">𝄽<span class="d">&nbsp;</span></div>`
    : `<div class="mcard ${n.dir||''} ${n.error?'err':''}" data-i="${i}" style="width:${34+n.beats*18}px" title="${n.error?'Nota inexistente nesta mão':''}">${n.spell?spellName(n,true):noteName(n.midi)}<span class="d">${n.error?'?':n.dir==='open'?'abre':'fecha'}</span></div>`
  ).join('');
  const missing = m.notes.filter(n=>n.error).map(n=>noteName(n.midi));
  const warn = [];
  if(missing.length) warn.push(`Notas que não existem na mão ${m.hand==='left'?'esquerda':'direita'} (serão puladas): ${[...new Set(missing)].join(', ')}.`);
  if(m.bad.length) warn.push(`Trechos não reconhecidos: ${m.bad.join(' ')}`);
  $('#melWarn').style.display = warn.length?'block':'none'; $('#melWarn').textContent = warn.join(' ');
  const first = playableNotes()[0];
  setMelDir(first ? first.dir : 'open'); hintBtn(first); markCur(-1);
  melFeed(''); $('#melStat').textContent = `${playableNotes().length} notas · ${countChanges()} troca(s) de fole sugerida(s)`;
  renderGuide();
}
function countChanges(){ const p=playableNotes(); return p.filter((n,i)=>i && n.dir!==p[i-1].dir).length; }

$('#melStrip').addEventListener('click', e=>{
  const c=e.target.closest('.mcard'); if(!c || mel.running) return;
  const n=mel.cur.notes[+c.dataset.i]; if(n.rest||n.error) return;
  playNote(n.midi, 0.6, mel.cur.hand); hintBtn(n); markCur(+c.dataset.i); guideStep(+c.dataset.i);
});

function stopMelody(){
  mel.timers.forEach(clearTimeout); mel.timers=[];
  if(mel.raf) cancelAnimationFrame(mel.raf); mel.raf=null;
  if(mel.bus){ mel.bus.disconnect(); mel.bus=null; }
  mel.running=false; $('#melStart').textContent='▶ Começar';
}
function finishMel(msg, score){
  stopMelody(); melFeed(msg, score==null?'':score>=80?'ok':'bad'); markCur(-1);
  if(score!=null){
    const id=mel.cur.id, prev=state.progress.melodies[id];
    if(prev==null || score>prev){ state.progress.melodies[id]=score; saveProgress(); renderMelList(); if(mel.cur.guide) renderScaleGrid(); }
  }
}
$('#melStart').onclick = ()=>{
  if(mel.running){ stopMelody(); melFeed('Parado.'); return; }
  if(!playableNotes().length) return;
  ac(); $$('#melStrip .mcard').forEach(c=>c.classList.remove('ok','bad'));
  mel.running=true; mel.errors=0; mel.hits=0; $('#melStart').textContent='■ Parar'; melFeed('');
  ({listen:startListen, wait:startWait, timed:startTimed})[$('#melMode').value]();
};
$('#melMode').onchange = ()=>{ stopMelody(); renderMelPlayer(); };
$('#melSpeed').oninput = e=>{ $('#melSpeedVal').textContent=e.target.value+'%'; };

// Modo Ouvir: o app toca e mostra botão + direção
function startListen(){
  const spb = 60/(mel.cur.bpm*melSpeed()); let t=300;
  mel.cur.notes.forEach((n,i)=>{
    const dur = n.beats*spb*1000;
    mel.timers.push(setTimeout(()=>{
      markCur(i);
      if(n.rest || n.error) return;
      guideStep(i);
      if(n.dir!==mel.dir) setMelDir(n.dir);
      const k=melKb(); k.clearMarks(); k.mark(n.btn.id,'down',dur*0.9);
      playNote(n.midi, n.beats*spb*0.9, mel.cur.hand);
      $('#melStat').textContent = `${lbl(n)} · ${dirLabel(n.dir).toLowerCase()}`;
    }, t));
    t += dur;
  });
  mel.timers.push(setTimeout(()=>finishMel('Fim. Agora tente no modo Espera.'), t+200));
}

// Modo Espera: avança só quando você acerta
function startWait(){ mel.idx=-1; advanceWait(); }
function advanceWait(){
  const notes=mel.cur.notes;
  do{ mel.idx++; } while(mel.idx<notes.length && (notes[mel.idx].rest || notes[mel.idx].error));
  if(mel.idx>=notes.length){
    const total=playableNotes().length, acc=Math.round(100*total/(total+mel.errors));
    finishMel(`Concluído! ${mel.errors} erro(s) · precisão ${acc}%`, acc); hintBtn(null); return;
  }
  const n=notes[mel.idx]; markCur(mel.idx); hintBtn(n); guideStep(mel.idx);
  if($('#melAuto').checked && n.dir!==mel.dir) setMelDir(n.dir);
  const pos=playableNotes().indexOf(n)+1;
  $('#melStat').textContent = `Nota ${pos}/${playableNotes().length}: ${lbl(n)} · ${dirLabel(n.dir).toLowerCase()}`;
}
function melPress(b, m, dir){
  if(!mel.running) return;
  const mode=$('#melMode').value;
  if(mode==='wait'){
    const n=mel.cur.notes[mel.idx]; if(!n) return;
    if(m===n.midi){
      cardCls(mel.idx,'ok');
      melFeed(dir===n.dir?'Certo!':`Certo! A sugestão era ${dirLabel(n.dir).toLowerCase()}, mas essa nota também vale.`, 'ok');
      advanceWait();
    } else {
      mel.errors++; cardCls(mel.idx,'bad');
      melFeed(b.id===n.btn.id ? `Botão certo, mas o fole está ${dirLabel(dir).toLowerCase()}. Troque a direção (Espaço).` : `Esse é ${noteName(m)}.`, 'bad');
    }
  } else if(mode==='timed') timedPress(m);
}

// Modo No tempo: contagem de 4 tempos e depois as notas correm sozinhas
function startTimed(){
  const c=ac(), spb=60/(mel.cur.bpm*melSpeed()), t0=c.currentTime+0.4;
  mel.bus=c.createGain(); mel.bus.connect(master);
  let t=t0+4*spb; mel.events=[]; mel.upcoming=null;
  mel.cur.notes.forEach((n,i)=>{ if(!n.rest && !n.error) mel.events.push({i, t, n, judged:false}); t+=n.beats*spb; });
  mel.tEnd=t;
  for(let bt=t0, k=0; bt<t-0.01; bt+=spb, k++) clickSound(bt, k<4 || k%4===0, mel.bus);
  const tick=()=>{
    const now=c.currentTime;
    if(now<t0+4*spb) $('#melStat').textContent = 'Prepare-se… '+Math.max(1,4-Math.floor((now-t0)/spb));
    for(const e of mel.events) if(!e.judged && e.t<now-0.25){ e.judged=true; mel.errors++; cardCls(e.i,'bad'); }
    const up=mel.events.find(e=>!e.judged && e.t>now-0.25);
    if(up && up!==mel.upcoming){
      mel.upcoming=up; markCur(up.i); hintBtn(up.n);
      if($('#melAuto').checked && up.n.dir!==mel.dir) setMelDir(up.n.dir);
      if(now>=t0+4*spb) $('#melStat').textContent = `${lbl(up.n)} · ${dirLabel(up.n.dir).toLowerCase()}`;
    }
    if(now>mel.tEnd+0.4){
      const score=Math.round(100*mel.hits/mel.events.length);
      finishMel(`Fim! ${mel.hits}/${mel.events.length} notas certas no tempo (${score}%)`, score); hintBtn(null); return;
    }
    mel.raf=requestAnimationFrame(tick);
  };
  mel.raf=requestAnimationFrame(tick);
}
function timedPress(m){
  const now=ac().currentTime - (AC.outputLatency||0);
  const cands=mel.events.filter(e=>!e.judged && Math.abs(e.t-now)<0.25);
  if(!cands.length){ melFeed('Fora do tempo','bad'); return; }
  const e=cands.reduce((a,b)=>Math.abs(b.t-now)<Math.abs(a.t-now)?b:a); e.judged=true;
  const ms=Math.round((now-e.t)*1000);
  if(e.n.midi===m){
    mel.hits++; cardCls(e.i,'ok');
    melFeed(Math.abs(ms)<=60?'No tempo!':ms<0?`Certo, adiantado ${-ms} ms`:`Certo, atrasado ${ms} ms`, 'ok');
  } else { mel.errors++; cardCls(e.i,'bad'); melFeed(`Nota errada (${noteName(m)})`,'bad'); }
}

// Editor
function openEditor(text, id){
  stopMelody(); mel.editingId=id;
  $('#melText').value=text; $('#melErr').textContent=''; $('#melErr').className='feedback bad'; $('#melImport').style.display='none';
  $('#melDelete').style.display = id?'inline-block':'none';
  $('#melEditor').style.display='block'; $('#melText').focus();
}
$('#melNew').onclick=()=>openEditor(MEL_TEMPLATE, null);
$('#melEdit').onclick=()=>openEditor(mel.cur.text, mel.cur.builtin?null:mel.cur.id);
$('#melCancel').onclick=()=>{ $('#melEditor').style.display='none'; };
$('#melSave').onclick=()=>{
  const text=$('#melText').value, m=parseMelody(text);
  if(!m.notes.some(n=>!n.rest)){ $('#melErr').textContent='Nenhuma nota reconhecida.'; return; }
  if(m.bad.length){ $('#melErr').textContent='Não entendi: '+m.bad.join(' '); return; }
  const list=customMelodies(); let id=mel.editingId;
  if(id){ list.find(x=>x.id===id).text=text; }
  else { id='u'+Date.now(); list.push({id, text}); }
  store.set('melodies', list); loadMelody(id);
};
$('#melDelete').onclick=()=>{
  if(!mel.editingId || !confirm('Excluir esta melodia?')) return;
  store.set('melodies', customMelodies().filter(x=>x.id!==mel.editingId));
  delete state.progress.melodies[mel.editingId]; saveProgress();
  loadMelody(BUILTIN_MELODIES[0].id);
};
