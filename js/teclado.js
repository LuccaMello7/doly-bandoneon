/* ================== Componente teclado ================== */
// Desenha o teclado de uma mão a partir de state.layout e trata os toques. Cada aba cria os seus
// com kb(elemento, 'left'|'right', opções):
//   getDir()      direção do fole deste teclado (padrão: state.dir)
//   showLabels()  mostra ou esconde os nomes das notas
//   onPress(b, midi, dir, api)  chamado ao apertar um botão
//   perRow        1 se o teclado fica sozinho na linha (afeta o tamanho automático)
//   largura()     largura disponível em px, quando o teclado fica numa área menor que a página
//   editable, canSound, sound   edição do mapa e controle do som
// Devolve uma api para marcar botões (dica, acerto, erro, acorde, cor do mapa de erros).
let kbSeq=0;
// Tamanho do botão conforme a largura da tela. perRow = quantos teclados lado a lado (1 ou 2)
function autoKeySize(maxX, perRow, largura){
  const W = largura || Math.min(1150, document.documentElement.clientWidth) - 48;
  const per = perRow===1 ? 1 : (W>=860 ? 2 : 1);
  return Math.max(30, Math.min(48, Math.floor((W/per - (per===2?130:16)) / (maxX+1))));
}
function createKeyboard(el, hand, opts={}){
  const uid='k'+(kbSeq++);
  let size=48, dia=38;
  const held=new Set(), nodes={};
  el.addEventListener('contextmenu', e=>e.preventDefault());
  function build(){
    el.innerHTML=''; el.className='kbd';
    const bs=state.layout[hand], maxX=Math.max(...bs.map(b=>b.x)), maxY=Math.max(...bs.map(b=>b.y));
    size=opts.size||autoKeySize(maxX, opts.perRow, opts.largura&&opts.largura()); dia=Math.round(size*0.8); api.size=size;
    el.style.width=((maxX+1)*size+10)+'px'; el.style.height=((maxY+1)*size+10)+'px';
    el.style.fontSize=Math.max(8, Math.round(size*0.21))+'px';
    for(const b of state.layout[hand]){
      const d=document.createElement('button'); d.className='key';
      Object.assign(d.style,{left:(8+b.x*size)+'px', top:(8+b.y*size)+'px', width:dia+'px', height:dia+'px'});
      d.type='button';
      const getDir=()=>opts.getDir?opts.getDir():state.dir;
      const press=e=>{ e.preventDefault(); if(held.has(b.id)) return;
        if(state.editing && opts.editable){ editButton(b); return; }
        const dir=getDir(), midi=b[dir]; held.add(b.id); d.classList.add('down');
        if(opts.sound!==false && (!opts.canSound || opts.canSound())) startVoice(uid+b.id, midi, hand);
        opts.onPress && opts.onPress(b, midi, dir, api);
      };
      const release=()=>{ if(!held.has(b.id)) return; held.delete(b.id); d.classList.remove('down'); stopVoice(uid+b.id); opts.onRelease&&opts.onRelease(b); };
      // Eventos de ponteiro servem para mouse e toque (vários dedos = acorde). Sair do botão solta a nota.
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
      d.setAttribute('aria-label', show ? `${noteName(b.open)} abrindo, ${noteName(b.close)} fechando` : 'Botão do bandoneon');
      d.classList.toggle('sharp', [1,3,6,8,10].includes(m%12));
      d.classList.toggle('edit', state.editing && !!opts.editable);
    }
  }
  const api={
    hand, build, refresh, held, size, perRow:opts.perRow, largura:opts.largura,
    // ao inverter o fole as notas seguradas mudam de altura, como no instrumento
    retune(){ const dir=opts.getDir?opts.getDir():state.dir;
      for(const id of held){ const b=nodes[id].b; if(voices[uid+id]) startVoice(uid+id,b[dir],hand); } },
    silence(){ for(const id of held) stopVoice(uid+id,true); },
    mark(id,cls,ms=600){ const n=nodes[id]; if(!n) return; n.d.classList.add(cls); if(ms) setTimeout(()=>n.d.classList.remove(cls),ms); },
    unmark(id,cls){ const n=nodes[id]; if(n) n.d.classList.remove(cls); },
    tint(id,color){ const n=nodes[id]; if(!n) return; n.d.style.background=color; n.d.style.color=color?'#fff':''; },
    clearMarks(){ Object.values(nodes).forEach(({d})=>d.classList.remove('ok','bad','hint','chord','guia','prox')); },
    // número do dedo recomendado sobre o botão (null tira)
    dedo(id,n){ const x=nodes[id]; if(!x) return; if(n==null) delete x.d.dataset.dedo; else x.d.dataset.dedo=n; },
    clearDedos(){ Object.values(nodes).forEach(({d})=>{ delete d.dataset.dedo; }); },
    setDim(v){ Object.values(nodes).forEach(({d})=>d.classList.toggle('dim',v)); },
  };
  build();
  return api;
}
// Ao girar o celular ou redimensionar a janela, refaz os teclados cujo tamanho mudou
let resizeTimer=null;
window.addEventListener('resize', ()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{
    let changed=false;
    for(const k of allKeyboards){
      const bs=state.layout[k.hand], maxX=Math.max(...bs.map(b=>b.x));
      if(autoKeySize(maxX, k.perRow, k.largura&&k.largura())!==k.size && k.held.size===0){ k.build(); changed=true; }
    }
    if(changed && typeof onKeyboardsResized==='function') onKeyboardsResized();
  }, 150);
});
const allKeyboards=[];
function kb(el,hand,opts){ const k=createKeyboard(el,hand,opts); allKeyboards.push(k); return k; }
function refreshAll(){ allKeyboards.forEach(k=>k.refresh()); }
function rebuildAll(){ allKeyboards.forEach(k=>k.build()); onLayoutChange(); }
