// ---------- Escalas guiadas ----------
const SCALE_TYPES = {
  maior:{name:'Maior', steps:[2,2,1,2,2,2,1], spell:'maj',
    info:'Fórmula: T T S T T T S. Os semitons ficam entre o 3º e o 4º graus e entre o 7º e o 8º.'},
  menor:{name:'Menor natural', steps:[2,1,2,2,1,2,2], spell:'min',
    info:'Fórmula: T S T T S T T. Mesmas notas da escala maior que começa uma terça menor acima (Lá menor e Dó maior, por exemplo).'},
  harmonica:{name:'Menor harmônica', steps:[2,1,2,2,1,3,1], spell:'min',
    info:'É a menor natural com o 7º grau elevado (a sensível). Entre o 6º e o 7º graus fica um intervalo de tom e meio, um som muito presente no tango.'},
  melodica:{name:'Menor melódica', steps:[2,1,2,2,2,2,1], down:[2,1,2,2,1,2,2], spell:'min',
    info:'Subindo, o 6º e o 7º graus são elevados. Descendo, ela volta a ser igual à menor natural (forma tradicional).'},
  cromatica:{name:'Cromática', steps:Array(12).fill(1), spell:null,
    info:'Todos os 12 semitons. É a melhor forma de passear pelo mapa inteiro de botões.'},
};
const TONIC_SPELL = {maj:['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'], min:['C','C#','D','Eb','E','F','F#','G','G#','A','Bb','B']};
const ACC_SYM = {'-2':'𝄫','-1':'♭','0':'','1':'♯','2':'𝄪'};
const STEP_NAME = {1:'semitom', 2:'tom', 3:'tom e meio'};
function spellName(n, withOct){
  const nm = letterNames()[n.spell.letter] + ACC_SYM[n.spell.acc];
  return withOct ? nm + (Math.floor((n.midi - n.spell.acc)/12) - 1) : nm;
}
function tonicLabel(type, pc){
  const sp = SCALE_TYPES[type].spell;
  if(!sp) return (state.names==='pt'?PT:EN)[pc];
  const t = TONIC_SPELL[sp][pc], letter='CDEFGAB'.indexOf(t[0]), acc = t[1]==='#'?1:t[1]==='b'?-1:0;
  return letterNames()[letter] + ACC_SYM[acc];
}
function scaleNotes(type, pc, start, octs, dirMode){
  const T = SCALE_TYPES[type], up = [], deg = T.steps.length;
  let m = start;
  for(let i=0; i<=deg*octs; i++){ up.push({midi:m, degree:i%deg+1}); m += T.steps[i%deg]; }
  let all = up;
  if(dirMode==='updown'){
    const dsteps = T.down || T.steps, down = [];
    m = up[up.length-1].midi;
    for(let i=deg*octs-1; i>=0; i--){ m -= dsteps[i%deg]; down.push({midi:m, degree:i%deg+1}); }
    all = up.concat(down);
  }
  if(T.spell){
    const t = TONIC_SPELL[T.spell][pc], L0 = 'CDEFGAB'.indexOf(t[0]);
    for(const n of all){
      const letter = (L0 + n.degree - 1) % 7;
      let acc = ((n.midi - DIA_SEMI[letter]) % 12 + 12) % 12; if(acc>6) acc -= 12;
      n.spell = {letter, acc};
    }
  }
  return all;
}
function validStarts(type, pc, hand, octs){
  const L = state.layout[hand], has = m => L.some(b=>b.open===m || b.close===m), out = [];
  for(let m=pc+12; m<=108; m+=12) if(scaleNotes(type, pc, m, octs, 'updown').every(n=>has(n.midi))) out.push(m);
  const center = hand==='left' ? 48 : 62;
  return out.sort((a,b)=>Math.abs(a-center)-Math.abs(b-center));
}
function fillScaleTonics(){
  const type=$('#scType').value, cur=$('#scTonic').value||'0';
  $('#scTonic').innerHTML = Array.from({length:12},(_,pc)=>`<option value="${pc}">${tonicLabel(type,pc)}</option>`).join('');
  $('#scTonic').value = cur; fillScaleStarts(); renderScaleGrid();
}
function fillScaleStarts(){
  const type=$('#scType').value, pc=+$('#scTonic').value, hand=$('#scHand').value, octs=+$('#scOct').value;
  const st = validStarts(type, pc, hand, octs);
  const name = n => tonicLabel(type, pc) + (Math.floor(n/12)-1);
  $('#scStart').innerHTML = st.map(m=>`<option value="${m}">${name(m)}</option>`).join('');
  $('#scErr').textContent = st.length ? '' : `Essa escala não cabe em ${octs} oitava(s) na mão ${hand==='left'?'esquerda':'direita'}. Tente 1 oitava ou a outra mão.`;
  $('#scGo').disabled = !st.length;
}
$('#scType').innerHTML = Object.entries(SCALE_TYPES).map(([k,t])=>`<option value="${k}">${t.name}</option>`).join('');
$('#scType').onchange = fillScaleTonics;
['#scTonic','#scHand','#scOct'].forEach(id=>$(id).onchange=()=>{ fillScaleStarts(); renderScaleGrid(); });
$('#scaleOpen').onclick = ()=>{ const c=$('#scaleCard'); const show=c.style.display==='none'; c.style.display=show?'block':'none'; if(show){ fillScaleTonics(); c.scrollIntoView({block:'start', behavior:'smooth'}); } };
$('#scClose').onclick = ()=>{ $('#scaleCard').style.display='none'; };
$('#scGo').onclick = ()=>loadScale($('#scType').value, +$('#scTonic').value, $('#scHand').value, +$('#scOct').value, +$('#scStart').value, $('#scDir').value);

const scaleId = (type, pc, hand, octs) => `esc:${type}:${pc}:${hand}:${octs}`;
function loadScale(type, pc, hand, octs, start, dirMode){
  stopMelody();
  const T = SCALE_TYPES[type], notes = scaleNotes(type, pc, start, octs, dirMode);
  notes.forEach((n,i)=>{ n.beats = i===notes.length-1 ? 2 : 1; });
  const title = `${tonicLabel(type,pc)} ${T.name.toLowerCase()}${type==='cromatica'?' (a partir de '+tonicLabel(type,pc)+')':''}`;
  const tok = n => noteToken(n.midi)+':'+(n.beats===2?'2':'4');
  const m = {title:`Escala: ${title}`, desc:`${octs} oitava(s)`, hand, bpm:72, notes, bad:[],
    id:scaleId(type,pc,hand,octs), builtin:true, guide:{type, pc},
    text:`título: Escala: ${title}\nmão: ${hand==='left'?'esquerda':'direita'}\nbpm: 72\n${notes.map(tok).join(' ')}`};
  fingerMelody(m); mel.cur = m;
  $('#melEditor').style.display='none'; $('#melImport').style.display='none'; $('#scaleCard').style.display='none'; $('#melPlayer').style.display='block';
  if($('#melMode').value==='listen') $('#melMode').value='wait';
  renderMelList(); renderMelPlayer();
}

function renderGuide(){
  const g = mel.cur && mel.cur.guide, box = $('#melGuide');
  box.style.display = g ? 'block' : 'none';
  if(!g) return;
  const T = SCALE_TYPES[g.type], ns = mel.cur.notes;
  const top = ns.reduce((a,b)=>b.midi>a.midi?b:a), upTo = ns.indexOf(top);
  const names = ns.slice(0, upTo+1).map(n=>n.spell?spellName(n):noteName(n.midi).replace(/-?\d+$/,''));
  const changes = [];
  ns.forEach((n,i)=>{ if(i && n.dir!==ns[i-1].dir) changes.push(`${lbl(ns[i-1])} → ${lbl(n)} (${dirLabel(n.dir).toLowerCase()})`); });
  $('#guideIntro').innerHTML = `<b>${T.info}</b><br>Notas: ${names.join(' · ')}<br>`+
    `Fole: começa <b>${dirLabel(ns[0].dir).toLowerCase()}</b>` + (changes.length ? ` e troca ${changes.length}×: ${changes.join('; ')}.` : ', sem trocas.')+
    `<br><span class="muted">No modo Espera, siga o contorno dourado. Aqui embaixo aparece a explicação de cada passo.</span>`;
  $('#guideStep').innerHTML = '';
}
const lbl = n => n.spell ? spellName(n,true) : noteName(n.midi);
function relPos(a, b){
  if(a.id===b.id) return '<b>mesmo botão</b>, só muda o fole';
  const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
  const v = dy<-0.25?'acima':dy>0.25?'abaixo':'', h = dx>0.25?'à direita':dx<-0.25?'à esquerda':'';
  return (d<1.3?'botão vizinho':'botão mais distante') + (v||h ? ', '+[v,h].filter(Boolean).join(' e ') : '');
}
function guideStep(i){
  const g = mel.cur && mel.cur.guide; if(!g) return;
  const ns = mel.cur.notes, n = ns[i], prev = ns[i-1];
  let html = `Passo ${i+1}/${ns.length}: <b>${lbl(n)}</b>`;
  if(SCALE_TYPES[g.type].spell) html += ` · ${n.degree}º grau`;
  html += ` · <b>${dirLabel(n.dir).toLowerCase()}</b>`;
  if(prev){
    const diff = Math.abs(n.midi-prev.midi);
    html += `<br>${n.midi>prev.midi?'Sobe':'Desce'} ${STEP_NAME[diff]||diff+' semitons'} a partir de ${lbl(prev)} · ${relPos(prev.btn, n.btn)}`;
    if(prev.dir!==n.dir) html += ` · <span class="chg">troque o fole para ${dirLabel(n.dir).toLowerCase()}!</span>`;
  } else html += '<br>Nota inicial (tônica). Prepare o fole e comece.';
  $('#guideStep').innerHTML = html;
}

function renderScaleGrid(){
  const hand=$('#scHand').value, octs=+$('#scOct').value, P=state.progress.melodies;
  let h = `<table class="sgrid"><tr><th>${hand==='left'?'Esq.':'Dir.'} · ${octs} oit.</th>`+
    Array.from({length:12},(_,pc)=>`<th>${(state.names==='pt'?PT:EN)[pc]}</th>`).join('')+'</tr>';
  for(const [k,T] of Object.entries(SCALE_TYPES)){
    h += `<tr><th style="text-align:left">${T.name}</th>`;
    for(let pc=0; pc<12; pc++){
      const v = P[scaleId(k,pc,hand,octs)];
      h += `<td data-t="${k}" data-pc="${pc}" class="${v==null?'':v>=90?'g3':v>=70?'g2':'g1'}" title="${tonicLabel(k,pc)} ${T.name.toLowerCase()}">${v==null?'':v+'%'}</td>`;
    }
    h += '</tr>';
  }
  $('#scGrid').innerHTML = h + '</table>';
}
$('#scGrid').addEventListener('click', e=>{
  const td = e.target.closest('td'); if(!td) return;
  $('#scType').value = td.dataset.t; fillScaleTonics(); $('#scTonic').value = td.dataset.pc; fillScaleStarts();
  if(!$('#scGo').disabled) $('#scGo').click();
});
