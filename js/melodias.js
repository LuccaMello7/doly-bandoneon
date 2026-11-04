/* ================== Melodias ================== */
// Player com os modos Ouvir, Espera e No tempo, para uma ou duas mãos.
// Modelo de uma melodia carregada (mel.cur):
//   notes  = notas {midi, beats, hand, t (início em tempos), dir, btn, error}, em ordem de tempo
//   groups = "momentos": notas que começam juntas {t, dur, idxs (índices em notes), dir, rest}
// parseMelody lê o formato de texto; buildTimeline agrupa; fingerMelody escolhe fole e botões.
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
{id:'ode-duas', text:`título: Ode à Alegria a duas mãos
bpm: 80
descrição: Melodia na mão direita e baixos na esquerda. Um fole só: as duas mãos sempre na mesma direção.
direita: Mi4 Mi4 Fá4 Sol4 | Sol4 Fá4 Mi4 Ré4 | Dó4 Dó4 Ré4 Mi4 | Mi4:4. Ré4:8 Ré4:2 |
Mi4 Mi4 Fá4 Sol4 | Sol4 Fá4 Mi4 Ré4 | Dó4 Dó4 Ré4 Mi4 | Ré4:4. Dó4:8 Dó4:2
esquerda: Dó3:2 Dó3:2 | Sol2:2 Sol2:2 | Dó3:2 Dó3:2 | Sol2:2 Sol2:2 |
Dó3:2 Dó3:2 | Sol2:2 Sol2:2 | Dó3:2 Dó3:2 | Sol2:2 Dó3:2`},
];
// Modelo de "Nova melodia" no idioma atual (o leitor aceita as palavras-chave nos três idiomas)
const melTemplate = () => ({
  pt:'título: Minha melodia\nmão: direita\nbpm: 80\ndescrição:\nDó4:4 Ré4:4 Mi4:4 p:4 | Mi4:4 Ré4:4 Dó4:2',
  es:'título: Mi melodía\nmano: derecha\nbpm: 80\ndescripción:\nDo4:4 Re4:4 Mi4:4 p:4 | Mi4:4 Re4:4 Do4:2',
  en:'title: My melody\nhand: right\nbpm: 80\ndescription:\nC4:4 D4:4 E4:4 p:4 | E4:4 D4:4 C4:2',
})[state.lang];

state.progress.melodies = state.progress.melodies || {};
const mel = {cur:null, idx:-1, g:-1, pending:new Set(), dir:'open', running:false, timers:[], raf:null, bus:null,
             errors:0, hits:0, events:[], upcoming:null, editingId:null};

function customMelodies(){ return store.get('melodies', []); }
function allMelodies(){ return BUILTIN_MELODIES.map(m=>({...m, builtin:true})).concat(customMelodies()); }

// Formato de texto. Linhas "direita:" e "esquerda:" escolhem a mão (cada mão tem seu próprio tempo);
// linhas sem prefixo continuam na mão atual (padrão: a do cabeçalho "mão:").
function parseMelody(text){
  const m = {title:'Sem título', desc:'', hand:'right', bpm:80, notes:[], bad:[]};
  const cursor = {left:0, right:0}, lastByHand = {};
  let hand = null;
  for(const raw of text.split('\n')){
    let line = raw;
    const h = line.match(/^\s*([^:\s]+)\s*:\s*(.*)$/);
    let key = h && h[1].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    const ALIAS = {title:'titulo', mano:'mao', hand:'mao', descripcion:'descricao', description:'descricao',
                   derecha:'direita', right:'direita', izquierda:'esquerda', left:'esquerda'};
    if(h && ALIAS[key]) key = ALIAS[key];
    if(h && ['titulo','mao','bpm','descricao'].includes(key)){
      const v=h[2].trim();
      if(key==='titulo') m.title=v||m.title;
      else if(key==='descricao') m.desc=v;
      else if(key==='bpm') m.bpm=Math.max(20,Math.min(240,parseInt(v)||80));
      else m.hand = /esq|izq|left/i.test(v)?'left':'right';
      continue;
    }
    if(h && (key==='direita' || key==='esquerda')){ hand = key==='direita'?'right':'left'; line = h[2]; }
    const H = hand || m.hand;
    for(const tok of line.split(/\s+/).filter(Boolean)){
      if(tok==='|') continue;
      // nota[:duração][/a|/f][@dedo[,alternativos]][~]   ex.: Mi4:8/a@3,2~
      const t = tok.match(/^([^:\/~@]+)(?::(\d+)(\.|t)?)?(?:\/([afAF]))?(?:@([1-5](?:,[1-5])*))?(~)?$/);
      if(!t){ m.bad.push(tok); continue; }
      const div = t[2]?parseInt(t[2]):4;
      if(![1,2,4,8,16,32].includes(div)){ m.bad.push(tok); continue; }
      const beats = 4/div*(t[3]==='.'?1.5:t[3]==='t'?2/3:1);
      if(/^p(ausa)?$/i.test(t[1])){ m.notes.push({rest:true, beats, hand:H, t:cursor[H]}); cursor[H]+=beats; lastByHand[H]=null; continue; }
      const midi = parseNote(t[1]);
      if(midi==null){ m.bad.push(tok); continue; }
      const last = lastByHand[H];
      if(last && last.tie && last.midi===midi){ last.beats+=beats; last.tie=!!t[6]; cursor[H]+=beats; continue; }
      const dedos = t[5] ? t[5].split(',').map(Number) : [];
      const n = {midi, beats, hand:H, t:cursor[H], force: t[4] ? (t[4].toLowerCase()==='a'?'open':'close') : null, tie:!!t[6],
                 dedo: dedos.length ? dedos[0] : null, alt: dedos.slice(1)};
      m.notes.push(n); lastByHand[H]=n; cursor[H]+=beats;
    }
  }
  if(cursor.left && cursor.right) m.hand='both';
  return m;
}

// Ordena as notas no tempo e agrupa as que começam juntas (ex.: melodia + baixo)
const EPS = 1e-6;
function buildTimeline(m){
  // notas sem tempo (ex.: escalas geradas) recebem tempo sequencial
  let c = 0;
  for(const n of m.notes){ if(n.t==null){ n.t=c; } c = n.t + n.beats; if(!n.hand) n.hand = m.hand==='both'?'right':m.hand; }
  const ends = m.notes.filter(n=>!n.rest).map(n=>[n.t, n.t+n.beats]);
  // numa melodia a duas mãos, uma pausa só aparece se as duas mãos estiverem em silêncio
  const silent = r => !ends.some(([a,b])=>a < r.t+r.beats-EPS && b > r.t+EPS);
  m.notes = m.notes.filter(n=>!n.rest || silent(n))
    .sort((a,b)=>a.t-b.t || (a.hand===b.hand?0:a.hand==='right'?-1:1));
  m.groups = [];
  m.notes.forEach((n,i)=>{
    const g = m.groups[m.groups.length-1];
    if(g && !n.rest && !g.rest && Math.abs(g.t-n.t)<EPS){ g.idxs.push(i); n.g = m.groups.length-1; }
    else { m.groups.push({t:n.t, idxs:[i], rest:!!n.rest}); n.g = m.groups.length-1; }
  });
  const total = Math.max(0, ...m.notes.map(n=>n.t+n.beats));
  m.groups.forEach((g,k)=>{ g.dur = (k+1<m.groups.length ? m.groups[k+1].t : total) - g.t; });
  m.totalBeats = total;
}

// Escolhe a direção do fole em cada momento minimizando trocas, sem passar de BELLOWS_SEC
// segundos na mesma direção. Um fole só para as duas mãos: notas que começam juntas usam a
// mesma direção, e o fole não pode inverter enquanto alguma nota ainda está soando.
const BELLOWS_SEC = 6;
function fingerMelody(m){
  if(!m.groups) buildTimeline(m);
  const spb = 60/m.bpm, has = (n,d)=>state.layout[n.hand].some(b=>b[d]===n.midi);
  for(const n of m.notes){ n.error=false; n.conflict=false; n.dir=null; n.btn=null; }
  let states = [{dir:null, run:0, cost:0, prev:null}], restBefore=false;
  const steps = [];
  m.groups.forEach(g=>{
    if(g.rest){ restBefore=true; return; }
    const ns = g.idxs.map(i=>m.notes[i]);
    ns.forEach(n=>{ if(!['open','close'].some(d=>(!n.force||n.force===d) && has(n,d))) n.error=true; });
    const ok = ns.filter(n=>!n.error);
    if(!ok.length) return;
    let dirs = ['open','close'].filter(d=>ok.every(n=>(!n.force||n.force===d) && has(n,d)));
    if(!dirs.length){ // mãos pedem direções diferentes: vale a primeira nota (mão direita)
      const f = ok[0]; dirs = ['open','close'].filter(d=>(!f.force||f.force===d) && has(f,d));
      ok.slice(1).forEach(n=>{ if(!dirs.some(d=>has(n,d))){ n.error=true; n.conflict=true; } });
    }
    const sustained = m.notes.some(n=>!n.rest && !n.error && n.t < g.t-EPS && n.t+n.beats > g.t+EPS);
    const gsec = g.dur*spb;
    const step = (allowBreak)=>{
      const next = new Map();
      for(const s of states) for(const d of dirs){
        const same = s.dir===d;
        if(s.dir && !same && sustained && !allowBreak) continue;
        const run = (same?s.run:0) + gsec;
        const cost = s.cost + (s.dir && !same ? (restBefore?0.3:1) + (sustained?50:0) : 0) + (run>BELLOWS_SEC?20:0) + (!s.dir && d==='close'?0.01:0);
        const key = d+'|'+run.toFixed(2), ex = next.get(key);
        if(!ex || cost<ex.cost) next.set(key, {dir:d, run, cost, prev:s});
      }
      return next;
    };
    let next = step(false); if(!next.size) next = step(true);
    states = [];
    for(const d of ['open','close']){ // só estados não dominados (menos fole usado OU menor custo)
      let bestCost = Infinity;
      [...next.values()].filter(x=>x.dir===d).sort((a,b)=>a.run-b.run||a.cost-b.cost)
        .forEach(x=>{ if(x.cost<bestCost-1e-9){ states.push(x); bestCost=x.cost; } });
    }
    restBefore=false; steps.push(g);
  });
  if(!steps.length) return;
  const best = states.reduce((a,b)=>b.cost<a.cost?b:a), path=[];
  for(let st=best; st && st.dir; st=st.prev) path.unshift(st.dir);
  const prevBtn = {};
  steps.forEach((g,k)=>{
    g.dir = path[k];
    g.idxs.map(i=>m.notes[i]).filter(n=>!n.error).forEach(n=>{
      if(!has(n,g.dir)){ n.error=true; n.conflict=true; return; }
      n.dir = g.dir;
      const cands = state.layout[n.hand].filter(b=>b[n.dir]===n.midi), p = prevBtn[n.hand];
      n.btn = p ? cands.reduce((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)<Math.hypot(a.x-p.x,a.y-p.y)?b:a) : cands[0];
      prevBtn[n.hand] = n.btn;
    });
  });
}

const mkOpts = {getDir:()=>mel.dir, onPress:(b,m,dir)=>melPress(b,m,dir), perRow:1};
const mkL = kb($('#mkLeft'),'left',mkOpts), mkR = kb($('#mkRight'),'right',mkOpts);
const kbOf = hand => hand==='left' ? mkL : mkR;
const melSpeed = () => +$('#melSpeed').value/100;
const playableNotes = () => mel.cur.notes.filter(n=>!n.rest && !n.error);
const groupNotes = g => mel.cur.groups[g].idxs.map(i=>mel.cur.notes[i]).filter(n=>!n.rest && !n.error);
const pendingNotes = () => [...mel.pending].map(i=>mel.cur.notes[i]);
function onKeyboardsResized(){ if(mel.running && mel.g>=0) hintGroup(mel.g); }

function setMelDir(d){
  mel.dir = d; const p=$('#melDirPill');
  p.className='dirpill '+d; p.textContent = d==='open'?'⟵ ABRINDO ⟶':'⟶ FECHANDO ⟵';
  mkL.refresh(); mkR.refresh(); mkL.retune(); mkR.retune();
}
function melFeed(msg, cls=''){ const f=$('#melFeed'); f.className='feedback '+cls; f.textContent=msg; }
// i = índice da nota; o cartão é o do grupo dela
function cardEl(i){ const n=mel.cur.notes[i]; return n ? $(`#melStrip .mcard[data-g="${n.g}"]`) : null; }
function markCur(i){
  const g = i>=0 && mel.cur.notes[i] ? mel.cur.notes[i].g : -1;
  $$('#melStrip .mcard').forEach(c=>c.classList.toggle('cur', +c.dataset.g===g));
  // mantém o momento atual visível na faixa e na partitura (rolagem só horizontal)
  const c=$(`#melStrip .mcard[data-g="${g}"]`), strip=$('#melStrip');
  if(c){ const r=c.getBoundingClientRect(), s=strip.getBoundingClientRect(); strip.scrollLeft += (r.left+r.width/2) - (s.left+s.width/2); }
  staffCursor(g);
  if(typeof rollIniciar==='function') rollIniciar(); // notas caindo (cascata.js)
}
function cardCls(i, cls){ const c=cardEl(i); if(!c) return; c.classList.remove('ok','bad'); c.classList.add(cls); }
function hintGroup(g){
  mkL.clearMarks(); mkR.clearMarks();
  if(g>=0) groupNotes(g).forEach(n=>{ if(mel.pending.size===0 || mel.pending.has(mel.cur.notes.indexOf(n))) kbOf(n.hand).mark(n.btn.id,'hint',0); });
}
function hintBtn(n){ mkL.clearMarks(); mkR.clearMarks(); if(n && n.btn) kbOf(n.hand).mark(n.btn.id,'hint',0); }
const handLabel = h => t(h==='left'?'Mão esquerda':h==='right'?'Mão direita':'Duas mãos');

function renderMelList(){
  const cur = mel.cur && mel.cur.id, esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const opt = x => { const t=parseMelody(x.text), best=state.progress.melodies[x.id];
    return `<option value="${x.id}" ${x.id===cur?'selected':''}>${esc(t.title)}${best!=null?` — ${best}%`:''}</option>`; };
  const prontas = BUILTIN_MELODIES, suas = customMelodies();
  let h = `<optgroup label="Prontas">${prontas.map(opt).join('')}</optgroup>`;
  if(suas.length) h += `<optgroup label="Suas melodias">${suas.map(opt).join('')}</optgroup>`;
  if(mel.cur && mel.cur.guide){ const best=state.progress.melodies[mel.cur.id];
    h = `<optgroup label="Escala guiada"><option value="${mel.cur.id}" selected>${esc(mel.cur.title)}${best!=null?` — ${best}%`:''}</option></optgroup>` + h; }
  $('#melSelect').innerHTML = h;
}
$('#melSelect').onchange = e=>{ if(!e.target.value.startsWith('esc:')) loadMelody(e.target.value); };

function loadMelody(id){
  stopMelody();
  const src = allMelodies().find(x=>x.id===id) || allMelodies()[0];
  const m = parseMelody(src.text);
  Object.assign(m, {id:src.id, builtin:!!src.builtin, text:src.text});
  fingerMelody(m); mel.cur = m;
  $('#melEditor').style.display='none'; $('#melPlayer').style.display='block';
  renderMelList(); renderMelPlayer();
}
function onLayoutChange(){
  if(mel.cur){ stopMelody(); fingerMelody(mel.cur); renderMelPlayer(); }
  if(typeof acadAoMudarMapa==='function') acadAoMudarMapa(); // a Academia refaz os exercícios com o mapa novo
}

const noteLabel = n => n.spell ? spellName(n,true) : noteName(n.midi);
function renderMelPlayer(){
  const m = mel.cur;
  $('#melTitle').textContent = m.title;
  $('#melDesc').textContent = `${m.desc ? m.desc+' · ' : ''}${handLabel(m.hand)} · ${m.bpm} BPM`;
  $('#mkLeftWrap').style.display = m.hand!=='right'?'flex':'none';
  $('#mkRightWrap').style.display = m.hand!=='left'?'flex':'none';
  $('#melStrip').innerHTML = m.groups.map((g,k)=>{
    const w = 34 + Math.min(g.dur,4)*18;
    if(g.rest) return `<div class="mcard rest" data-g="${k}" style="width:${w}px">𝄽<span class="d">&nbsp;</span></div>`;
    const ns = g.idxs.map(i=>m.notes[i]), err = ns.some(n=>n.error);
    const names = ns.map(n=>`<span class="${n.error?'errn':''}" title="${n.error?(n.conflict?'Conflito de fole com a outra mão':'Nota inexistente nesta mão'):''}">${noteLabel(n)}${m.hand==='both'?`<small> ${maoLetra(n.hand)}</small>`:''}</span>`).join('<br>');
    return `<div class="mcard ${g.dir||''} ${err?'err':''}" data-g="${k}" style="width:${w}px">${names}<span class="d">${!g.dir?'?':g.dir==='open'?'abre':'fecha'}</span></div>`;
  }).join('');
  const missing = m.notes.filter(n=>n.error && !n.conflict).map(n=>noteName(n.midi)), conflicts = m.notes.filter(n=>n.conflict).length;
  const warn = [];
  if(missing.length) warn.push(`Notas que não existem na mão indicada (serão puladas): ${[...new Set(missing)].join(', ')}.`);
  if(conflicts) warn.push(`${conflicts} nota(s) da mão esquerda não existem na mesma direção de fole da mão direita naquele momento (serão puladas).`);
  if(m.bad.length) warn.push(`Trechos não reconhecidos: ${m.bad.join(' ')}`);
  $('#melWarn').style.display = warn.length?'block':'none'; $('#melWarn').textContent = warn.join(' ');
  drawMelStaff();
  const first = m.groups.find(g=>!g.rest && g.dir);
  mel.pending = new Set();
  setMelDir(first ? first.dir : 'open'); markCur(-1); if(first) hintGroup(m.groups.indexOf(first));
  melFeed(''); $('#melStat').textContent = `${playableNotes().length} notas · ${countChanges()} troca(s) de fole sugerida(s)`;
  renderGuide();
}
function countChanges(){ const gs=mel.cur.groups.filter(g=>g.dir); return gs.filter((g,i)=>i && g.dir!==gs[i-1].dir).length; }

$('#melStrip').addEventListener('click', e=>{
  const c=e.target.closest('.mcard'); if(!c || mel.running) return;
  const g=+c.dataset.g, ns=mel.cur.groups[g].rest?[]:groupNotes(g); if(!ns.length) return;
  ns.forEach(n=>playNote(n.midi, 0.6, n.hand)); mel.pending=new Set(); hintGroup(g); markCur(mel.cur.groups[g].idxs[0]); guideStep(mel.cur.groups[g].idxs[0]);
});

/* ---------- Partitura com cursor ---------- */
const SHARP_LETTER = [0,0,1,1,2,3,3,4,4,5,5,6], SHARP_ACC = [0,1,0,1,0,0,1,0,1,0,1,0];
function staffPos(n){ // índice diatônico (oitava*7+letra) e acidente
  if(n.spell) return {d:(Math.floor((n.midi-n.spell.acc)/12)-1)*7+n.spell.letter, acc:n.spell.acc};
  const pc=((n.midi%12)+12)%12; return {d:(Math.floor(n.midi/12)-1)*7+SHARP_LETTER[pc], acc:SHARP_ACC[pc]};
}
function drawMelStaff(){
  const m=mel.cur, box=$('#melStaff');
  if(!$('#melStaffOn').checked){ box.style.display='none'; return; }
  box.style.display='block';
  const PX=44, X0=58, hands = m.hand==='both'?['right','left']:[m.hand];
  const staffs = hands.map((h,k)=>({hand:h, top:20+k*90, bottomD:h==='right'?30:18, clef:h==='right'?'𝄞':'𝄢'}));
  const W = X0 + Math.max(4,m.totalBeats)*PX + 30, H = 20 + hands.length*90 + 10;
  const Y = (st,d) => st.top+40 - (d-st.bottomD)*5;
  let s='';
  for(const st of staffs){
    for(let i=0;i<5;i++) s+=`<line x1="4" x2="${W-4}" y1="${st.top+i*10}" y2="${st.top+i*10}" class="sl"/>`;
    s+= st.clef==='𝄞' ? `<text x="6" y="${st.top+44}" font-size="52" class="clef">𝄞</text>` : `<text x="8" y="${st.top+30}" font-size="34" class="clef">𝄢</text>`;
  }
  for(let b=4; b<m.totalBeats-EPS; b+=4){ const x=X0+b*PX-PX*0.35; s+=`<line x1="${x}" x2="${x}" y1="${staffs[0].top}" y2="${staffs[staffs.length-1].top+40}" class="sl"/>`; }
  m.groups.forEach((g,k)=>{
    const x = X0 + g.t*PX;
    let gs = `<g data-g="${k}">`;
    if(g.rest){ const st=staffs[0]; gs+=`<text x="${x-5}" y="${st.top+26}" font-size="20" class="clef">𝄽</text>`; }
    for(const i of g.idxs){
      const n=m.notes[i]; if(n.rest) continue;
      const st=staffs.find(z=>z.hand===n.hand)||staffs[0], {d,acc}=staffPos(n), y=Y(st,d);
      for(let k2=st.bottomD-2;k2>=d;k2-=2) gs+=`<line x1="${x-10}" x2="${x+10}" y1="${Y(st,k2)}" y2="${Y(st,k2)}" class="sl"/>`;
      for(let k2=st.bottomD+10;k2<=d;k2+=2) gs+=`<line x1="${x-10}" x2="${x+10}" y1="${Y(st,k2)}" y2="${Y(st,k2)}" class="sl"/>`;
      if(acc) gs+=`<text x="${x-19}" y="${y+5}" font-size="15" class="acc">${acc>0?'♯':'♭'}</text>`;
      const hollow = n.beats>=2-EPS;
      gs+=`<ellipse cx="${x}" cy="${y}" rx="6" ry="4.4" transform="rotate(-20 ${x} ${y})" class="nh ${hollow?'hollow':''} ${n.error?'nerr':''}"/>`;
      if(n.beats<4-EPS){ const up=d<st.bottomD+4; gs+= up?`<line x1="${x+5.5}" x2="${x+5.5}" y1="${y}" y2="${y-28}" class="stem"/>`:`<line x1="${x-5.5}" x2="${x-5.5}" y1="${y}" y2="${y+28}" class="stem"/>`; }
    }
    s += gs + '</g>';
  });
  s += `<line id="staffCur" x1="0" x2="0" y1="${staffs[0].top-8}" y2="${staffs[staffs.length-1].top+48}" class="scur" style="display:none"/>`;
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}
function staffCursor(g){
  const box=$('#melStaff'), svg=box.querySelector('svg'); if(!svg) return;
  svg.querySelectorAll('g.cur').forEach(e=>e.classList.remove('cur'));
  const cur=$('#staffCur');
  if(g<0 || !mel.cur.groups[g]){ cur.style.display='none'; return; }
  const x = 58 + mel.cur.groups[g].t*44;
  cur.setAttribute('x1',x); cur.setAttribute('x2',x); cur.style.display='';
  const el=svg.querySelector(`g[data-g="${g}"]`); if(el) el.classList.add('cur');
  box.scrollLeft = x - box.clientWidth/2;
}
$('#melStaffOn').onchange=()=>{ store.set('staffOn', $('#melStaffOn').checked); drawMelStaff(); if(mel.g>=0) staffCursor(mel.g); };
$('#melStaffOn').checked = store.get('staffOn', true);

function stopMelody(){
  mel.timers.forEach(clearTimeout); mel.timers=[];
  if(mel.raf) cancelAnimationFrame(mel.raf); mel.raf=null;
  if(mel.bus){ mel.bus.disconnect(); mel.bus=null; }
  mel.running=false; mel.rollTipo=null; $('#melStart').textContent='▶ Começar';
}
function finishMel(msg, score){
  stopMelody(); melFeed(msg, score==null?'':score>=80?'ok':'bad'); markCur(-1); mel.g=-1;
  if(score!=null){
    const id=mel.cur.id, prev=state.progress.melodies[id];
    if(prev==null || score>prev){ state.progress.melodies[id]=score; saveProgress(); renderMelList(); if(mel.cur.guide) renderScaleGrid(); }
    logPractice(mel.cur.guide ? 'escala' : 'melodia');
    if(score>=90) comemorar();
  }
}
$('#melStart').onclick = ()=>{
  if(mel.running){ stopMelody(); melFeed('Parado.'); return; }
  if(!playableNotes().length) return;
  ac(); $$('#melStrip .mcard').forEach(c=>c.classList.remove('ok','bad'));
  mel.running=true; mel.errors=0; mel.hits=0; $('#melStart').textContent='■ Parar'; melFeed('');
  ({listen:startListen, wait:startWait, timed:startTimed})[$('#melMode').value]();
  if(window.innerWidth<700) $('#guideIntroBox').open=false; // no celular, mais espaço para praticar
  $('#melStrip').scrollIntoView({block:'start', behavior:'smooth'});
};
$('#melMode').onchange = ()=>{ stopMelody(); renderMelPlayer(); };
$('#melSpeed').oninput = e=>{ $('#melSpeedVal').textContent=e.target.value+'%'; };

// Modo Ouvir: o app toca e mostra botões + direção
function startListen(){
  const spb = 60/(mel.cur.bpm*melSpeed());
  Object.assign(mel, {rollTipo:'listen', rollInicio:performance.now()/1000+0.3, rollSpb:spb});
  mel.cur.groups.forEach((g,k)=>{
    mel.timers.push(setTimeout(()=>{
      const i0=g.idxs[0]; mel.g=k; markCur(i0);
      if(g.rest || !g.dir) return;
      guideStep(i0);
      if(g.dir!==mel.dir) setMelDir(g.dir);
      mkL.clearMarks(); mkR.clearMarks();
      const ns=groupNotes(k);
      ns.forEach(n=>{ kbOf(n.hand).mark(n.btn.id,'down',n.beats*spb*900); playNote(n.midi, n.beats*spb*0.9, n.hand); });
      $('#melStat').textContent = `${ns.map(noteLabel).join(' + ')} · ${dirLabel(g.dir).toLowerCase()}`;
    }, 300 + g.t*spb*1000));
  });
  mel.timers.push(setTimeout(()=>finishMel('Fim. Agora tente no modo Espera.'), 500 + mel.cur.totalBeats*spb*1000));
}

// Modo Espera: avança quando todas as notas do momento foram tocadas
function startWait(){ mel.g=-1; advanceWait(); }
function advanceWait(){
  const gs=mel.cur.groups;
  do{ mel.g++; } while(mel.g<gs.length && !groupNotes(mel.g).length);
  if(mel.g>=gs.length){
    const total=playableNotes().length, acc=Math.round(100*total/(total+mel.errors));
    mel.pending=new Set(); finishMel(`Concluído! ${mel.errors} erro(s) · precisão ${acc}%`, acc); hintBtn(null); return;
  }
  const ns=groupNotes(mel.g); mel.idx=gs[mel.g].idxs[0];
  mel.pending=new Set(ns.map(n=>mel.cur.notes.indexOf(n)));
  markCur(mel.idx); hintGroup(mel.g); guideStep(mel.idx);
  if($('#melAuto').checked && gs[mel.g].dir!==mel.dir) setMelDir(gs[mel.g].dir);
  const done=playableNotes().filter(n=>n.g<mel.g).length;
  $('#melStat').textContent = `Nota ${done+1}/${playableNotes().length}: ${ns.map(noteLabel).join(' + ')} · ${dirLabel(gs[mel.g].dir).toLowerCase()}`;
}
// Nota tocada (botão na tela ou microfone). Devolve true se completou o momento.
function waitHit(i){
  mel.pending.delete(i); const n=mel.cur.notes[i]; kbOf(n.hand).unmark(n.btn.id,'hint');
  if(mel.pending.size) return false;
  cardCls(mel.idx,'ok'); advanceWait(); return true;
}
function melPress(b, m, dir){
  if(!mel.running) return;
  const mode=$('#melMode').value, hand=b.id.startsWith('left')?'left':'right';
  if(mode==='wait'){
    const ns=pendingNotes(); if(!ns.length) return;
    const hit=ns.find(n=>n.midi===m && n.hand===hand);
    if(hit){
      const sug=hit.dir, completes=mel.pending.size===1;
      melFeed(!completes ? 'Certo! Falta a outra nota deste momento.' : dir===sug ? 'Certo!' : `Certo! A sugestão era ${dirLabel(sug).toLowerCase()}, mas essa nota também vale.`, 'ok');
      waitHit(mel.cur.notes.indexOf(hit)); // pode concluir a melodia e trocar a mensagem
    } else {
      mel.errors++; cardCls(mel.idx,'bad');
      const same=ns.find(n=>n.btn.id===b.id);
      melFeed(same ? `Botão certo, mas o fole está ${dirLabel(dir).toLowerCase()}. Troque a direção (Espaço).` : `Esse é ${noteName(m)}.`, 'bad');
    }
  } else if(mode==='timed') timedPress(m);
}
// microfone: só ouve uma nota por vez, então qualquer nota certa completa o momento
function melHear(m){
  const ns=pendingNotes(); if(!ns.length) return;
  const hit=ns.find(n=>micMatches(m,n.midi));
  if(hit){ const i=mel.cur.notes.indexOf(hit); mel.pending=new Set([i]); melFeed('Certo!','ok'); waitHit(i); }
  else { mel.errors++; cardCls(mel.idx,'bad'); melFeed(`Ouvi ${noteName(m)}; a nota é ${ns.map(noteLabel).join(' ou ')}.`,'bad'); }
}

// Modo No tempo: contagem de 4 tempos e depois as notas correm sozinhas
function startTimed(){
  const c=ac(), spb=60/(mel.cur.bpm*melSpeed()), t0=c.currentTime+0.4;
  mel.bus=c.createGain(); mel.bus.connect(master);
  const start=t0+4*spb; mel.events=[]; mel.upcoming=null;
  Object.assign(mel, {rollTipo:'timed', rollInicio:start, rollSpb:spb});
  mel.cur.notes.forEach((n,i)=>{ if(!n.rest && !n.error) mel.events.push({i, t:start+n.t*spb, n, judged:false}); });
  mel.tEnd=start+mel.cur.totalBeats*spb;
  for(let bt=t0, k=0; bt<mel.tEnd-0.01; bt+=spb, k++) clickSound(bt, k<4 || k%4===0, mel.bus);
  const tick=()=>{
    const now=c.currentTime;
    if(now<start) $('#melStat').textContent = 'Prepare-se… '+Math.max(1,4-Math.floor((now-t0)/spb));
    for(const e of mel.events) if(!e.judged && e.t<now-0.25){ e.judged=true; mel.errors++; cardCls(e.i,'bad'); }
    const up=mel.events.find(e=>!e.judged && e.t>now-0.25);
    if(up && up!==mel.upcoming){
      const g=up.n.g; mel.upcoming=up; mel.g=g; markCur(up.i); mel.pending=new Set(); hintGroup(g);
      if($('#melAuto').checked && mel.cur.groups[g].dir!==mel.dir) setMelDir(mel.cur.groups[g].dir);
      if(now>=start) $('#melStat').textContent = `${groupNotes(g).map(noteLabel).join(' + ')} · ${dirLabel(mel.cur.groups[g].dir).toLowerCase()}`;
    }
    if(now>mel.tEnd+0.4){
      const score=Math.round(100*mel.hits/mel.events.length);
      finishMel(`Fim! ${mel.hits}/${mel.events.length} notas certas no tempo (${score}%)`, score); hintBtn(null); return;
    }
    mel.raf=requestAnimationFrame(tick);
  };
  mel.raf=requestAnimationFrame(tick);
}
function timedPress(m, when, fromMic){
  const now = when ?? (ac().currentTime - (AC.outputLatency||0));
  const cands=mel.events.filter(e=>!e.judged && Math.abs(e.t-now)<0.25);
  if(!cands.length){ melFeed('Fora do tempo','bad'); return; }
  const match = e => fromMic ? micMatches(m, e.n.midi) : e.n.midi===m;
  const pool = cands.some(match) ? cands.filter(match) : cands; // com duas mãos, prefere a nota que bate
  const e=pool.reduce((a,b)=>Math.abs(b.t-now)<Math.abs(a.t-now)?b:a); e.judged=true;
  const ms=Math.round((now-e.t)*1000);
  if(match(e)){
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
$('#melNew').onclick=()=>openEditor(melTemplate(), null);
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
  if(!mel.editingId || !confirm(t('Excluir esta melodia?'))) return;
  store.set('melodies', customMelodies().filter(x=>x.id!==mel.editingId));
  delete state.progress.melodies[mel.editingId]; saveProgress();
  loadMelody(BUILTIN_MELODIES[0].id);
};
