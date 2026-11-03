/* ================== Componente teclado ================== */
let kbSeq=0;
function createKeyboard(el, hand, opts={}){
  const uid='k'+(kbSeq++), size=opts.size||48, dia=Math.round(size*0.8);
  const held=new Set(), nodes={};
  function build(){
    el.innerHTML=''; el.className='kbd';
    const bs=state.layout[hand], maxX=Math.max(...bs.map(b=>b.x)), maxY=Math.max(...bs.map(b=>b.y));
    el.style.width=((maxX+1)*size+10)+'px'; el.style.height=((maxY+1)*size+10)+'px';
    for(const b of state.layout[hand]){
      const d=document.createElement('button'); d.className='key';
      Object.assign(d.style,{left:(8+b.x*size)+'px', top:(8+b.y*size)+'px', width:dia+'px', height:dia+'px'});
      const getDir=()=>opts.getDir?opts.getDir():state.dir;
      const press=e=>{ e.preventDefault(); if(held.has(b.id)) return;
        if(state.editing && opts.editable){ editButton(b); return; }
        const dir=getDir(), midi=b[dir]; held.add(b.id); d.classList.add('down');
        if(opts.sound!==false && (!opts.canSound || opts.canSound())) startVoice(uid+b.id, midi, hand);
        opts.onPress && opts.onPress(b, midi, dir, api);
      };
      const release=()=>{ if(!held.has(b.id)) return; held.delete(b.id); d.classList.remove('down'); stopVoice(uid+b.id); opts.onRelease&&opts.onRelease(b); };
      d.addEventListener('pointerdown',press);
      ['pointerup','pointerleave','pointercancel'].forEach(t=>d.addEventListener(t,release));
      el.appendChild(d); nodes[b.id]={d,b};
    }
    refresh();
  }
  function refresh(){
    const dir=opts.getDir?opts.getDir():state.dir, show=opts.showLabels?opts.showLabels():state.showLabels;
    for(const {d,b} of Object.values(nodes)){
      const m=b[dir]; d.textContent = show ? noteName(m) : '';
      d.classList.toggle('sharp', [1,3,6,8,10].includes(m%12));
      d.classList.toggle('edit', state.editing && !!opts.editable);
    }
  }
  const api={
    hand, build, refresh, held,
    retune(){ const dir=opts.getDir?opts.getDir():state.dir;
      for(const id of held){ const b=nodes[id].b; if(voices[uid+id]) startVoice(uid+id,b[dir],hand); } },
    silence(){ for(const id of held) stopVoice(uid+id,true); },
    mark(id,cls,ms=600){ const n=nodes[id]; if(!n) return; n.d.classList.add(cls); if(ms) setTimeout(()=>n.d.classList.remove(cls),ms); },
    clearMarks(){ Object.values(nodes).forEach(({d})=>d.classList.remove('ok','bad','hint')); },
    setDim(v){ Object.values(nodes).forEach(({d})=>d.classList.toggle('dim',v)); },
  };
  build();
  return api;
}
const allKeyboards=[];
function kb(el,hand,opts){ const k=createKeyboard(el,hand,opts); allKeyboards.push(k); return k; }
function refreshAll(){ allKeyboards.forEach(k=>k.refresh()); }
function rebuildAll(){ allKeyboards.forEach(k=>k.build()); onLayoutChange(); }
