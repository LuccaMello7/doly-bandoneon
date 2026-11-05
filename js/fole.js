/* ================== Teclado livre + fole ================== */
// Aba Teclado com simulação do fole. bel.level vai de 0 (fechado) a 1 (todo aberto). Tocar move o
// fole na direção atual (mais rápido com mais notas). No limite, o som para até inverter a direção
// ou reposicionar o fole pela válvula de ar.
const bel = { level:0.15, valve:null, blocked:false, last:performance.now() };
const canSound=()=>!bel.blocked;
const tkOpts={ editable:true, canSound, onPress:(b,m,dir)=>{
  if(typeof marcar==='function') marcar('teclado');
  const other = dir==='open'?'close':'open';
  $('#keyInfo').innerHTML = `<b>${noteName(m)}</b> (${dirLabel(dir).toLowerCase()}) · o mesmo botão ${dir==='open'?'fechando':'abrindo'} dá <b>${noteName(b[other])}</b>`;
}};
const tkL = kb($('#kbLeft'),'left',tkOpts), tkR = kb($('#kbRight'),'right',tkOpts);
function setDir(d){
  state.dir=d; bel.blocked=false; $('#bellowsWarn').textContent='';
  const p=$('#dirPill'); p.className='dirpill '+d; p.textContent = d==='open'?'⟵ ABRINDO ⟶':'⟶ FECHANDO ⟵';
  tkL.refresh(); tkR.refresh(); tkL.retune(); tkR.retune();
}
$('#dirBtn').onclick=()=>setDir(state.dir==='open'?'close':'open');
// Ver uma mão por vez (no celular sobra espaço e os botões ficam maiores)
$('#tkVer').addEventListener('click', e=>{
  const b=e.target.closest('[data-ver]'); if(!b) return;
  $$('#tkVer [data-ver]').forEach(x=>x.classList.toggle('on', x===b));
  $('#tkInstrumento').dataset.ver=b.dataset.ver;
  tkOpts.perRow = b.dataset.ver==='duas' ? undefined : 1; // uma mão sozinha usa a largura toda
  tkL.build(); tkR.build();
});
$('#labelsBtn').onclick=e=>{ state.showLabels=!state.showLabels; e.target.classList.toggle('on',state.showLabels); tkL.refresh(); tkR.refresh(); };
// Válvula de ar: move o fole sem som. d = 'open' (abrir), 'close' (fechar) ou null (solta)
const valve=d=>{ bel.valve=d; $('#valveOpenBtn').classList.toggle('on',d==='open'); $('#valveCloseBtn').classList.toggle('on',d==='close'); };
[['#valveOpenBtn','open'],['#valveCloseBtn','close']].forEach(([id,d])=>{
  $(id).addEventListener('pointerdown',()=>valve(d));
  ['pointerup','pointerleave'].forEach(t=>$(id).addEventListener(t,()=>{ if(bel.valve===d) valve(null); }));
});
let foleSec=0; // segundos tocando: 1 minuto marca o "aquecimento de fole" da rotina
// Laço de animação (~60 vezes por segundo): atualiza a posição do fole e o desenho
function bellowsLoop(now){
  const dt=Math.min(0.1,(now-bel.last)/1000); bel.last=now;
  const notes=tkL.held.size+tkR.held.size;
  if(notes && !bel.blocked && (foleSec+=dt)>=60 && foleSec-dt<60) logPractice('fole');
  let rate=0, dir=state.dir;
  if(bel.valve){ rate=0.45; dir=bel.valve; }
  else if(notes && !bel.blocked) rate=0.07*Math.sqrt(notes)*(0.45+pressaoFole); // mais pressão, mais ar: o fole anda mais rápido
  if(rate){
    bel.level += (dir==='open'?1:-1)*rate*dt;
    if(bel.level>=1 || bel.level<=0){
      bel.level=Math.max(0,Math.min(1,bel.level));
      if(!bel.valve && notes && !bel.blocked){
        bel.blocked=true; tkL.silence(); tkR.silence();
        $('#bellowsWarn').textContent = state.dir==='open' ? 'Fole todo aberto! Troque para fechar (Espaço) ou feche pela válvula (F).' : 'Fole todo fechado! Troque para abrir (Espaço) ou abra pela válvula (A).';
      }
    }
  }
  // com a válvula o fole sai do limite e o som volta
  if(bel.blocked && (state.dir==='open' ? bel.level<0.97 : bel.level>0.03)){ bel.blocked=false; $('#bellowsWarn').textContent=''; }
  $('#bellows').style.width=(30+bel.level*220)+'px';
  requestAnimationFrame(bellowsLoop);
}
requestAnimationFrame(bellowsLoop);

// Edição do mapa: no modo edição, clicar num botão pede as notas abrindo e fechando.
// Exportar/Importar salvam o mapa em JSON.
$('#editBtn').onclick=e=>{ state.editing=!state.editing; e.target.classList.toggle('on',state.editing); $('#editHelp').style.display=state.editing?'block':'none'; refreshAll(); };
function editButton(b){
  const o=parseNote(prompt(t('Nota ABRINDO para este botão (atual: {})', noteName(b.open)), noteName(b.open).replace('♯','#')));
  if(o==null) return;
  const c=parseNote(prompt(t('Nota FECHANDO para este botão (atual: {})', noteName(b.close)), noteName(b.close).replace('♯','#')));
  if(c==null) return;
  b.open=o; b.close=c; state.layout.name='Personalizado'; store.set('layout',state.layout); refreshAll(); onLayoutChange();
  playNote(o,0.35); playNote(c,0.35,undefined,ac().currentTime+0.4);
}
$('#exportBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(state.layout,null,1)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='layout-bandoneon.json'; a.click();
};
$('#importBtn').onclick=()=>{
  const i=document.createElement('input'); i.type='file'; i.accept='.json,application/json';
  i.onchange=async()=>{ try{ const L=JSON.parse(await i.files[0].text());
      if(!L.left||!L.right) throw 0; state.layout=L; store.set('layout',L); rebuildAll(); alert(t('Layout importado!')); }
    catch(e){ alert(t('Arquivo inválido.')); } };
  i.click();
};
$('#resetBtn').onclick=()=>{ if(confirm(t('Voltar ao mapa padrão Rheinische 142? Suas edições serão perdidas.'))){ state.layout=makeDefaultLayout(); store.set('layout',state.layout); rebuildAll(); } };
