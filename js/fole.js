/* ================== Teclado livre + fole ================== */
// Aba Teclado com simulação do fole. bel.level vai de 0 (fechado) a 1 (todo aberto). Tocar move o
// fole na direção atual (mais rápido com mais notas). No limite, o som para até inverter a direção
// ou reposicionar o fole pela válvula de ar. Perto do fim (85%) o fole fica laranja, pulsa e o celular
// vibra; no fim a mensagem traz o botão "Trocar direção". No modo "Fole sem limite" (opcional, desligado
// por padrão) o fole volta sozinho para 15% e o som continua: bom para explorar, mas não é como no instrumento.
const bel = { level:0.15, valve:null, blocked:false, estado:'', livre:store.get('foleLivre', false), last:performance.now() };
const FOLE_QUASE = 0.85;
// há teclado de verdade? (classe posta por js/controles.js) Sem ele, os textos não falam de Espaço, A ou F
const comTeclado = ()=>document.documentElement.classList.contains('tem-teclado');
const canSound=()=>!bel.blocked;
const tkOpts={ editable:true, canSound, onPress:(b,m,dir)=>{
  if(typeof marcar==='function') marcar('teclado');
  const other = dir==='open'?'close':'open';
  $('#keyInfo').innerHTML = `<b>${noteName(m)}</b> (${dirLabel(dir).toLowerCase()}) · o mesmo botão ${dir==='open'?'fechando':'abrindo'} dá <b>${noteName(b[other])}</b>`;
}};
const tkL = kb($('#kbLeft'),'left',tkOpts), tkR = kb($('#kbRight'),'right',tkOpts);
function setDir(d){
  state.dir=d; bel.blocked=false;
  const p=$('#dirPill'); p.className='dirpill '+d; p.textContent = dirLabel(d);
  tkL.refresh(); tkR.refresh(); tkL.retune(); tkR.retune();
}
$('#dirBtn').onclick=()=>setDir(state.dir==='open'?'close':'open');
// aviso do fole: o botão dentro da mensagem troca a direção (no celular não há tecla Espaço)
$('#bellowsWarn').addEventListener('click', e=>{ if(e.target.closest('[data-troca-fole]')) $('#dirBtn').click(); });
function avisoFole(estado){
  const w=$('#bellowsWarn'), b=$('#bellows');
  b.classList.toggle('quase', estado==='quase'); b.classList.toggle('fim', estado==='fim'); w.classList.toggle('quase', estado==='quase');
  const botao = `<button type="button" class="btn btn-troca" data-troca-fole>${t('Trocar direção')}</button>`;
  if(estado==='quase'){ vibrar('ok'); w.innerHTML = `<span>${t('Quase no fim: prepare a troca de direção.')}</span> ${botao}`; }
  else if(estado==='fim') w.innerHTML = `<span>${t(state.dir==='open'
    ? (comTeclado() ? 'Fole todo aberto! Troque para fechar (Espaço) ou feche pela válvula (F).' : 'Fole todo aberto! Troque a direção ou feche pela válvula.')
    : (comTeclado() ? 'Fole todo fechado! Troque para abrir (Espaço) ou abra pela válvula (A).' : 'Fole todo fechado! Troque a direção ou abra pela válvula.'))}</span> ${botao}`;
  else w.textContent='';
}
// modo livre: ligar explica que no bandoneon de verdade não é assim
function setFoleLivre(v){
  bel.livre=!!v; store.set('foleLivre', bel.livre);
  const b=$('#foleLivreBtn'); b.classList.toggle('on', bel.livre); b.setAttribute('aria-pressed', bel.livre);
}
$('#foleLivreBtn').onclick=()=>{ setFoleLivre(!bel.livre);
  if(bel.livre) avisar(t('Fole sem limite: ao chegar no fim, o fole volta sozinho e o som continua. No bandoneon de verdade é preciso trocar a direção.')); };
setFoleLivre(bel.livre);
// Ver uma mão por vez (no celular sobra espaço e os botões ficam maiores)
$('#tkVer').addEventListener('click', e=>{
  const b=e.target.closest('[data-ver]'); if(!b) return;
  $$('#tkVer [data-ver]').forEach(x=>x.classList.toggle('on', x===b));
  $('#tkInstrumento').dataset.ver=b.dataset.ver;
  tkOpts.perRow = b.dataset.ver==='duas' ? undefined : 1; // uma mão sozinha usa a largura toda
  if(tkCheia) ajustarCheia(); else { tkL.build(); tkR.build(); }
});
// tocar na pílula do fole (ABRINDO/FECHANDO) troca a direção: no celular fica bem entre as mãos
$('#dirPill').onclick=()=>$('#dirBtn').click();

// Tela cheia: só o instrumento e o fole, com os botões do maior tamanho que cabe na tela (no celular
// deitado eles ficam bem maiores). Usa a tela cheia do navegador quando existe; no iPhone, que não tem,
// o cartão cobre a página. O seletor de mãos e o fole sobem para a barra de cima e voltam ao sair.
const tkCard=$('#tkCard'), tkBarra=$('#tkCheiaBarra'), tkVolta={};
let tkCheia=false, tkCheiaTimer=0;
const tkMover=el=>{ tkVolta[el.id]=[el.parentNode, el.nextSibling]; tkBarra.appendChild(el); };
const tkDevolver=el=>{ const [p,n]=tkVolta[el.id]; p.insertBefore(el, n); };
// tamanho do botão: o maior que deixa a(s) mão(s) inteira(s) na tela. Com duas mãos, testa lado a lado e
// uma embaixo da outra e fica com o arranjo que dá botões maiores (no celular deitado, em geral lado a lado).
function tamanhoCheia(){
  const ver=$('#tkInstrumento').dataset.ver||'duas', maos=ver==='duas' ? ['left','right'] : [ver];
  const W=tkCard.clientWidth-24, H=tkCard.clientHeight-tkBarra.offsetHeight-28;
  const cabe=(w,h)=>Math.min(...maos.map(m=>{ const L=state.layout[m];
    return Math.min((w-14)/(Math.max(...L.map(b=>b.x))+1), (h-14)/(Math.max(...L.map(b=>b.y))+1)); }));
  const emPe = maos.length>1 ? cabe(W, (H-12)/2) : cabe(W, H), deLado = maos.length>1 ? cabe((W-16)/2, H) : 0;
  $('#tkInstrumento').classList.toggle('lado', deLado>emPe);
  return Math.max(24, Math.min(84, Math.floor(Math.max(emPe, deLado))));
}
function ajustarCheia(){
  if(!tkCheia) return;
  tkCard.style.setProperty('--barra', tkBarra.offsetHeight+'px');
  tkOpts.size=tamanhoCheia(); tkOpts.diaFator=0.88; tkL.build(); tkR.build(); // círculo maior: alvo maior para o dedo
}
function entrarCheia(){
  if(tkCheia) return; tkCheia=true;
  tkMover($('#tkVer')); tkMover($('#foleBox'));
  tkBarra.hidden=false; tkCard.classList.add('cheia'); document.documentElement.classList.add('tk-cheia-on');
  const fs=tkCard.requestFullscreen||tkCard.webkitRequestFullscreen;
  if(fs){ try{ const p=fs.call(tkCard); if(p && p.then) p.then(()=>deitarTela(true)).catch(()=>{}); }catch(e){} }
  ajustarCheia(); $('#tkCheiaSair').focus();
}
function sairCheia(){
  if(!tkCheia) return; tkCheia=false;
  tkDevolver($('#tkVer')); tkDevolver($('#foleBox'));
  deitarTela(false); tkBarra.hidden=true; tkCard.classList.remove('cheia'); $('#tkInstrumento').classList.remove('lado');
  document.documentElement.classList.remove('tk-cheia-on');
  if(document.fullscreenElement||document.webkitFullscreenElement){
    const ex=document.exitFullscreen||document.webkitExitFullscreen;
    try{ const p=ex.call(document); if(p && p.catch) p.catch(()=>{}); }catch(e){}
  }
  delete tkOpts.size; delete tkOpts.diaFator; tkL.build(); tkR.build();
}
$$('[data-tk-cheia]').forEach(b=>b.addEventListener('click', entrarCheia));
$('#tkCheiaSair').onclick=sairCheia;
// saiu da tela cheia do navegador (Esc, gesto de voltar): sai também do modo; e refaz o tamanho quando a tela muda
['fullscreenchange','webkitfullscreenchange'].forEach(ev=>document.addEventListener(ev, ()=>{
  if(tkCheia && !(document.fullscreenElement||document.webkitFullscreenElement)) sairCheia(); else ajustarCheia(); }));
window.addEventListener('resize', ()=>{ if(tkCheia){ clearTimeout(tkCheiaTimer); tkCheiaTimer=setTimeout(ajustarCheia, 150); } });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && tkCheia) sairCheia(); });
ganchosAba.push(nova=>{ if(nova!=='teclado') sairCheia(); });
$('#labelsBtn').onclick=()=>setMostrarNomes(!state.showLabels);
// Válvula de ar: move o fole sem som. d = 'open' (abrir), 'close' (fechar) ou null (solta)
const valve=d=>{ bel.valve=d; $('#valveOpenBtn').classList.toggle('on',d==='open'); $('#valveCloseBtn').classList.toggle('on',d==='close'); };
[['#valveOpenBtn','open'],['#valveCloseBtn','close']].forEach(([id,d])=>{
  $(id).addEventListener('pointerdown',()=>valve(d));
  ['pointerup','pointerleave'].forEach(t=>$(id).addEventListener(t,()=>{ if(bel.valve===d) valve(null); }));
});
let foleSec=0; // segundos tocando: 1 minuto marca o "aquecimento de fole" da rotina
// Laço de animação (~60 vezes por segundo): atualiza a posição do fole e o desenho
// libera o som quando o fole sai do limite e mostra o aviso certo (perto do fim, no fim ou nenhum)
function atualizarAvisoFole(){
  if(bel.blocked && (state.dir==='open' ? bel.level<0.97 : bel.level>0.03)) bel.blocked=false;
  const estado = bel.blocked ? 'fim' : !bel.livre && (state.dir==='open' ? bel.level>=FOLE_QUASE : bel.level<=1-FOLE_QUASE) ? 'quase' : '';
  if(estado!==bel.estado){ bel.estado=estado; avisoFole(estado); }
}
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
      if(bel.livre && !bel.valve) bel.level = bel.level>=1 ? 0.15 : 0.85; // modo livre: recomeça e o som segue
      else bel.level=Math.max(0,Math.min(1,bel.level));
      if(!bel.livre && !bel.valve && notes && !bel.blocked){ bel.blocked=true; tkL.silence(); tkR.silence(); }
    }
  }
  // com a válvula o fole sai do limite e o som volta
  atualizarAvisoFole();
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
// Ajustes do teclado: dá para recolher (a escolha fica guardada). Recolhido, o cabeçalho mostra um resumo
function tkResumo(){
  const ver = $('#tkVer .on');
  $('#tkResumo').innerHTML = menuChips([[t('Nomes'), t(state.showLabels ? 'ligados' : 'desligados')], [t('Pressão'), Math.round(pressaoFole * 100) + '%'],
    [t('Ver'), ver ? ver.textContent.trim() : ''], typeof pc!=='undefined' && pc.ligado && [t('Teclado do computador'), t('ligado')], bel.livre && [t('Fole'), t('sem limite')]]);
}
function tkAjustes(aberto){
  $('#tkMenu').classList.toggle('recolhido', !aberto); $('#tkMenuCorpo').hidden = !aberto;
  $('#tkMenuCab').setAttribute('aria-expanded', aberto); store.set('tecladoAjustes', aberto);
  if(!aberto) tkResumo();
}
$('#tkMenuCab').onclick = ()=>tkAjustes($('#tkMenuCorpo').hidden);
['click', 'input'].forEach(ev=>$('#tkMenu').addEventListener(ev, ()=>requestAnimationFrame(tkResumo)));
document.addEventListener('pressao-fole', ()=>requestAnimationFrame(tkResumo));
tkAjustes(store.get('tecladoAjustes', true) !== false);
