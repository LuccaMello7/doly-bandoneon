// ---------- Importação MusicXML ----------
async function unzipMxl(buf){
  const u8=new Uint8Array(buf), dv=new DataView(buf), td=new TextDecoder();
  let eocd=-1;
  for(let i=u8.length-22; i>=Math.max(0,u8.length-65557); i--) if(dv.getUint32(i,true)===0x06054b50){ eocd=i; break; }
  if(eocd<0) throw new Error('Arquivo .mxl inválido.');
  const files={}; let q=dv.getUint32(eocd+16,true);
  for(let k=0, n=dv.getUint16(eocd+10,true); k<n; k++){
    const nlen=dv.getUint16(q+28,true), xlen=dv.getUint16(q+30,true), clen=dv.getUint16(q+32,true);
    files[td.decode(u8.subarray(q+46,q+46+nlen))] = {method:dv.getUint16(q+10,true), size:dv.getUint32(q+20,true), off:dv.getUint32(q+42,true)};
    q += 46+nlen+xlen+clen;
  }
  const read = async name=>{
    const f=files[name], start=f.off+30+dv.getUint16(f.off+26,true)+dv.getUint16(f.off+28,true);
    const data=u8.subarray(start, start+f.size);
    if(f.method===0) return td.decode(data);
    if(f.method!==8) throw new Error('Compressão do .mxl não suportada.');
    return new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
  };
  let root=null;
  if(files['META-INF/container.xml']){
    const c=new DOMParser().parseFromString(await read('META-INF/container.xml'),'application/xml');
    root=c.querySelector('rootfile')?.getAttribute('full-path');
  }
  if(!root || !files[root]) root=Object.keys(files).find(f=>!f.startsWith('META-INF') && /\.(xml|musicxml)$/i.test(f));
  if(!root) throw new Error('Nenhuma partitura encontrada dentro do .mxl.');
  return read(root);
}

function parseMusicXML(text){
  const doc=new DOMParser().parseFromString(text,'application/xml');
  if(doc.querySelector('parsererror')) throw new Error('O arquivo não é um XML válido.');
  if(doc.documentElement.nodeName==='score-timewise') throw new Error('Formato "timewise" não suportado. Exporte do MuseScore como MusicXML normal.');
  if(doc.documentElement.nodeName!=='score-partwise') throw new Error('Isso não parece um arquivo MusicXML.');
  const txt=sel=>doc.querySelector(sel)?.textContent?.trim();
  const title=txt('work > work-title')||txt('movement-title')||'Partitura importada';
  const names={}; doc.querySelectorAll('part-list > score-part').forEach(sp=>names[sp.id]=sp.querySelector('part-name')?.textContent?.trim()||sp.id);
  let tempo=null;
  const kid=(el,tag)=>[...el.children].find(c=>c.nodeName===tag);
  const parts=[...doc.documentElement.children].filter(e=>e.nodeName==='part').map(part=>{
    let divisions=1, pos=0, staves=1; const notes=[], measures=[];
    for(const m of [...part.children].filter(e=>e.nodeName==='measure')){
      const mStart=pos; let cur=0, maxCur=0, lastStart=0;
      for(const el of m.children){
        const tag=el.nodeName;
        if(tag==='attributes'){
          const d=el.querySelector('divisions'); if(d) divisions=+d.textContent||1;
          const st=el.querySelector('staves'); if(st) staves=Math.max(staves,+st.textContent);
        } else if(tag==='sound' || tag==='direction'){
          const snd = tag==='sound'?el:el.querySelector('sound');
          if(tempo==null && snd && snd.getAttribute('tempo')) tempo=+snd.getAttribute('tempo');
          const pm=el.querySelector('metronome per-minute'); if(tempo==null && pm) tempo=parseFloat(pm.textContent);
        } else if(tag==='backup'){ cur-=(+kid(el,'duration').textContent)/divisions; }
        else if(tag==='forward'){ cur+=(+kid(el,'duration').textContent)/divisions; maxCur=Math.max(maxCur,cur); }
        else if(tag==='note'){
          if(kid(el,'grace') || kid(el,'cue')) continue;
          const dur=(+(kid(el,'duration')?.textContent||0))/divisions, chord=!!kid(el,'chord');
          const start=mStart+(chord?lastStart:cur), pitch=kid(el,'pitch');
          if(pitch && dur>0){
            const midi=(+kid(pitch,'octave').textContent+1)*12 + DIA_SEMI['CDEFGAB'.indexOf(kid(pitch,'step').textContent.trim())] + Math.round(parseFloat(kid(pitch,'alter')?.textContent||0));
            const staff=+(kid(el,'staff')?.textContent||1);
            const tieStop=[...el.children].some(c=>c.nodeName==='tie' && c.getAttribute('type')==='stop');
            const prev=tieStop && notes.find(n=>n.midi===midi && n.staff===staff && Math.abs(n.start+n.dur-start)<1e-3);
            if(prev) prev.dur+=dur; else notes.push({start, dur, midi, staff});
          }
          if(!chord){ lastStart=cur; cur+=dur; maxCur=Math.max(maxCur,cur); }
        }
      }
      measures.push(mStart); pos=mStart+maxCur;
    }
    measures.push(pos);
    return {name:names[part.getAttribute('id')]||part.getAttribute('id'), notes, measures, staves};
  });
  if(!parts.some(p=>p.notes.length)) throw new Error('Nenhuma nota encontrada na partitura.');
  return {title, tempo:tempo?Math.round(tempo):null, parts};
}

// Pega uma linha melódica: em cada ataque, a nota mais aguda (ou mais grave)
function extractLine(part, staff, pick){
  const byStart=new Map();
  for(const n of part.notes){
    if(staff!=='all' && n.staff!==+staff) continue;
    const k=Math.round(n.start*1000), e=byStart.get(k);
    if(!e || (pick==='high'?n.midi>e.midi:n.midi<e.midi)) byStart.set(k,n);
  }
  const ev=[...byStart.values()].sort((a,b)=>a.start-b.start).map(n=>({...n}));
  for(let i=0;i<ev.length-1;i++) ev[i].dur=Math.min(ev[i].dur, ev[i+1].start-ev[i].start);
  return ev;
}
function bestOctaveShift(ev, hand){
  const L=state.layout[hand], has=m=>L.some(b=>b.open===m||b.close===m);
  let best=0, bestCount=-1;
  for(const sh of [0,-12,12,-24,24]){ const c=ev.filter(e=>has(e.midi+sh)).length; if(c>bestCount){ bestCount=c; best=sh; } }
  return best;
}
const DUR_TOKENS=[[4,'1'],[3,'2.'],[2,'2'],[1.5,'4.'],[4/3,'2t'],[1,'4'],[0.75,'8.'],[2/3,'4t'],[0.5,'8'],[0.375,'16.'],[1/3,'8t'],[0.25,'16'],[1/6,'16t'],[0.125,'32']];
function splitBeats(b){ const out=[]; let r=b; for(const [v,t] of DUR_TOKENS) while(r>=v-1e-3){ out.push(t); r-=v; } return out; }
const noteToken = m => PT[((m%12)+12)%12].replace('♯','#') + (Math.floor(m/12)-1);

// Um texto por compasso (pausas preenchem os buracos; ligaduras atravessam a barra)
function barsFor(part, ev, shift){
  const ms=part.measures, bars=[];
  for(let i=0;i<ms.length-1;i++){
    const a=ms[i], b=ms[i+1], toks=[]; let t=a;
    for(const e of ev){
      const s0=Math.max(e.start,a), s1=Math.min(e.start+e.dur,b);
      if(s1<=s0+1e-6) continue;
      if(s0>t+1e-3) splitBeats(s0-t).forEach(d=>toks.push('p:'+d));
      const ds=splitBeats(s1-s0), crosses=e.start+e.dur>b+1e-3;
      ds.forEach((d,j)=>toks.push(noteToken(e.midi+shift)+':'+d+(j<ds.length-1||crosses?'~':'')));
      t=s1;
    }
    if(b>t+1e-3) splitBeats(b-t).forEach(d=>toks.push('p:'+d));
    bars.push(toks.join(' '));
  }
  return bars;
}
// o.staff: número da pauta, 'all' (todas) ou 'hands' (pauta de cima → direita, de baixo → esquerda)
function melodyFromScore(score, o){
  const part=score.parts[o.part];
  const voices = o.staff==='hands'
    ? [{hand:'right', ev:extractLine(part,'1','high')}, {hand:'left', ev:extractLine(part,String(part.staves),'low')}]
    : [{hand:o.hand, ev:extractLine(part,o.staff,o.pick)}];
  if(voices.some(v=>!v.ev.length)) throw new Error('Essa pauta não tem notas.');
  voices.forEach(v=>{ v.shift = o.fitOctave ? bestOctaveShift(v.ev, v.hand) : 0; v.bars = barsFor(part, v.ev, v.shift); });
  // remove compassos só de pausa no início e no fim (em todas as mãos ao mesmo tempo, para não perder a sincronia)
  const isRest=x=>!x || x.split(' ').every(k=>k.startsWith('p:'));
  let a=0, b=voices[0].bars.length;
  while(a<b && voices.every(v=>isRest(v.bars[a]))) a++;
  while(b>a && voices.every(v=>isRest(v.bars[b-1]))) b--;
  const two = voices.length>1, body=[];
  for(const v of voices){
    const bars=v.bars.slice(a,b);
    for(let i=0;i<bars.length;i+=4) body.push((two && i===0 ? (v.hand==='right'?'direita: ':'esquerda: ') : '') + bars.slice(i,i+4).join(' | ')+' |');
  }
  const staffTxt = o.staff==='all' ? 'todas as pautas' : o.staff==='hands' ? 'duas mãos' : 'pauta '+o.staff;
  const shifts = voices.filter(v=>v.shift).map(v=>`${v.hand==='left'?'esquerda':'direita'} ${v.shift>0?'+':''}${v.shift/12} oitava(s)`);
  const desc = `Importado de MusicXML (${part.name}, ${staffTxt})${shifts.length?`, transposto: ${shifts.join(', ')}`:''}.`;
  const head = two ? '' : `mão: ${o.hand==='left'?'esquerda':'direita'}\n`;
  return {text:`título: ${score.title}\n${head}bpm: ${score.tempo||80}\ndescrição: ${desc}\n${body.join('\n')}`,
          count:voices.reduce((s,v)=>s+v.ev.length,0), shift:voices[0].shift};
}

let importedScore=null;
$('#melImportBtn').onclick=()=>{
  const i=document.createElement('input'); i.type='file'; i.accept='.mxl,.musicxml,.xml';
  i.onchange=async()=>{
    const f=i.files[0]; if(!f) return;
    $('#impErr').textContent='';
    try{
      const buf=await f.arrayBuffer(), u8=new Uint8Array(buf);
      const text = (u8[0]===0x50 && u8[1]===0x4b) ? await unzipMxl(buf) : new TextDecoder().decode(u8);
      importedScore=parseMusicXML(text);
    }catch(e){ importedScore=null; stopMelody(); $('#melImport').style.display='block'; $('#impInfo').textContent=f.name; $('#impErr').textContent=e.message; return; }
    stopMelody(); $('#melEditor').style.display='none'; $('#melImport').style.display='block';
    $('#impInfo').innerHTML=`<b>${importedScore.title}</b> · ${f.name}${importedScore.tempo?` · ${importedScore.tempo} BPM`:''}`;
    $('#impPart').innerHTML=importedScore.parts.map((p,k)=>`<option value="${k}">${p.name} (${p.notes.length} notas)</option>`).join('');
    $('#impPart').value=String(Math.max(0,importedScore.parts.findIndex(p=>p.notes.length)));
    fillStaves();
  };
  i.click();
};
function fillStaves(){
  const p=importedScore.parts[+$('#impPart').value], opts=[];
  for(let k=1;k<=p.staves;k++) opts.push(`<option value="${k}">${k}${p.staves>1?(k===1?' (superior)':k===p.staves?' (inferior)':''):''}</option>`);
  if(p.staves>1){ opts.push('<option value="hands">Duas mãos (de cima → direita, de baixo → esquerda)</option>'); opts.push('<option value="all">Todas numa mão só</option>'); }
  $('#impStaff').innerHTML=opts.join(''); staffDefaults();
}
function staffDefaults(){
  const st=$('#impStaff').value, p=importedScore.parts[+$('#impPart').value];
  const low = p.staves>1 && st===String(p.staves);
  $('#impHand').value = low?'left':'right'; $('#impPick').value = low?'low':'high';
  $('#impHand').disabled = $('#impPick').disabled = st==='hands';
}
$('#impPart').onchange=fillStaves;
$('#impStaff').onchange=staffDefaults;
$('#impCancel').onclick=()=>{ $('#melImport').style.display='none'; };
$('#impGo').onclick=()=>{
  try{
    const r=melodyFromScore(importedScore, {part:+$('#impPart').value, staff:$('#impStaff').value, pick:$('#impPick').value, hand:$('#impHand').value, fitOctave:$('#impOct').checked});
    $('#melImport').style.display='none';
    openEditor(r.text, null);
    $('#melErr').className='feedback ok';
    $('#melErr').textContent=`${r.count} notas importadas${r.shift?` (transpostas ${r.shift>0?'+':''}${r.shift/12} oitava)`:''}. Revise e clique em "Salvar e usar".`;
  }catch(e){ $('#impErr').textContent=e.message; }
};
