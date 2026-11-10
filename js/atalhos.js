/* ================== Teclado do computador ================== */
// Espaço: troca o fole (Teclado, Melodias e Academia) ou marca o tempo (Ritmo). A/F: seguram a válvula de ar.
document.addEventListener('keydown',e=>{
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if(e.code==='Space'){
    if(currentView==='teclado'){ e.preventDefault(); if(!e.repeat) setDir(state.dir==='open'?'close':'open'); }
    else if(currentView==='ritmo'){ e.preventDefault(); if(!e.repeat) tap(); }
    else if(currentView==='melodias'){ e.preventDefault(); if(!e.repeat && !$('#melAuto').checked) setMelDir(mel.dir==='open'?'close':'open'); }
    else if(currentView==='academia'){ e.preventDefault(); if(!e.repeat && !acadFoleAuto()) acadSetDir(acad.dir==='open'?'close':'open'); }
    else if(currentView==='inicio' && !(e.target.closest && e.target.closest('button,a,summary,[tabindex]'))){ e.preventDefault(); if(!e.repeat) iniTrocaFole(); } // o fole do instrumento do Início
  }
  if(currentView==='teclado' && (e.code==='KeyA'||e.code==='KeyF') && !(typeof pc!=='undefined' && pc.ligado)){ e.preventDefault(); // com o teclado do computador ligado, A e F tocam notas
    valve(e.code==='KeyA'?'open':'close'); }
});
document.addEventListener('keyup',e=>{ if((e.code==='KeyA' && bel.valve==='open') || (e.code==='KeyF' && bel.valve==='close')) valve(null); });
