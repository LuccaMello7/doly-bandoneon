/* ================== Controles: teclado do computador, controlador MIDI e pressão do fole ================== */
// Teclado do computador: cada tecla (pela posição física, event.code, então vale para qualquer layout)
// toca um botão do bandoneon. O mapa padrão põe as 4 fileiras do teclado sobre as fileiras de botões
// de cada mão; o aluno pode trocar qualquer tecla (pc.mapa = {código: {mao, id}}).
// Com o teclado ligado: Espaço troca o fole, ← e → seguram a válvula de ar, ↑ e ↓ mudam a pressão.
// MIDI: a nota tocada no controlador acende o botão que dá essa nota na direção atual do fole (ou o
// botão que o aluno "ensinou"). Dois controles (CC) podem ser aprendidos: pressão do fole e direção.
const FILEIRAS_PC = {
  left:  [['Digit1','Digit2','Digit3','Digit4','Digit5'], ['KeyQ','KeyW','KeyE','KeyR','KeyT'],
          ['KeyA','KeyS','KeyD','KeyF','KeyG'], ['KeyZ','KeyX','KeyC','KeyV','KeyB']],
  right: [['Digit6','Digit7','Digit8','Digit9','Digit0','Minus','Equal'], ['KeyY','KeyU','KeyI','KeyO','KeyP','BracketLeft','BracketRight'],
          ['KeyH','KeyJ','KeyK','KeyL','Semicolon','Quote','Backslash'], ['KeyN','KeyM','Comma','Period','Slash']],
};
const ROTULO_PC = {Minus:'-', Equal:'=', BracketLeft:'[', BracketRight:']', Semicolon:';', Quote:"'", Backslash:'\\',
  Comma:',', Period:'.', Slash:'/', Backquote:'`', IntlBackslash:'<', IntlRo:'/'};
// Mapa padrão: divide os botões de cada mão em fileiras pela altura e põe as teclas no meio de cada fileira
function mapaPcPadrao(){
  const mapa = {};
  for(const lado of ['left','right']){
    const bs = [...state.layout[lado]].sort((a,b)=>a.y-b.y), linhas = FILEIRAS_PC[lado], n = linhas.length;
    linhas.forEach((teclas, i)=>{
      const fileira = bs.slice(Math.round(i*bs.length/n), Math.round((i+1)*bs.length/n)).sort((a,b)=>a.x-b.x);
      const ini = Math.max(0, Math.round((fileira.length-teclas.length)/2));
      teclas.forEach((cod, j)=>{ const b = fileira[ini+j]; if(b) mapa[cod] = {mao:lado, id:b.id}; });
    });
  }
  return mapa;
}
const pc = {ligado: store.get('pcLigado', false), mapa: store.get('mapaPc', null) || mapaPcPadrao(), seguradas:{}, atribuindo:false, alvo:null, layout:null};
// letra que aparece na tecla (no Chrome/Edge, a do layout do usuário: ABNT2 mostra Ç no lugar do ;)
if(navigator.keyboard && navigator.keyboard.getLayoutMap) navigator.keyboard.getLayoutMap().then(m=>{ pc.layout = m; marcarTodas(); renderMapaPc(); }).catch(()=>{});
function rotuloTecla(cod){
  const l = pc.layout && pc.layout.get(cod); if(l) return l.toUpperCase();
  if(/^Key[A-Z]$/.test(cod)) return cod.slice(3);
  if(/^Digit\d$/.test(cod)) return cod.slice(5);
  if(/^Numpad\d$/.test(cod)) return 'Num' + cod.slice(6);
  return ROTULO_PC[cod] || cod;
}
const teclaDoBotao = (mao, id) => Object.keys(pc.mapa).find(c=>pc.mapa[c].mao===mao && pc.mapa[c].id===id);
const salvarMapaPc = () => { store.set('mapaPc', pc.mapa); marcarTodas(); renderMapaPc(); };
// teclado visível de uma mão na aba aberta (Teclado, Melodias, Academia, Desafios, Acordes…)
const tecladoVisivel = mao => allKeyboards.find(k=>k.hand===mao && k.el && k.el.offsetParent!==null);

// a letra da tecla em cada botão (só com o teclado do computador ligado)
function marcarTeclas(k){
  for(const b of state.layout[k.hand]){ const c = pc.ligado ? teclaDoBotao(k.hand, b.id) : null; k.tecla(b.id, c ? rotuloTecla(c) : null); }
}
function marcarTodas(){ allKeyboards.forEach(marcarTeclas); }

function soltarTudo(){
  for(const c of Object.keys(pc.seguradas)){ const {k,id} = pc.seguradas[c]; k.soltar(id); }
  pc.seguradas = {};
}
document.addEventListener('keydown', e=>{
  if(!pc.ligado || e.ctrlKey || e.metaKey || e.altKey) return;
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if(pc.atribuindo){ atribuirTecla(e); return; }
  if(document.querySelector('dialog[open]')) return;
  if(e.code==='ArrowUp' || e.code==='ArrowDown'){ e.preventDefault(); setPressao(pressaoFole + (e.code==='ArrowUp'?0.1:-0.1)); return; }
  if(currentView==='teclado' && (e.code==='ArrowLeft' || e.code==='ArrowRight')){ e.preventDefault(); if(!e.repeat) valve(e.code==='ArrowLeft'?'open':'close'); return; }
  const m = pc.mapa[e.code]; if(!m) return;
  e.preventDefault(); if(e.repeat || pc.seguradas[e.code]) return;
  const k = tecladoVisivel(m.mao); if(!k) return;
  k.tocar(m.id); pc.seguradas[e.code] = {k, id:m.id};
});
document.addEventListener('keyup', e=>{
  if((e.code==='ArrowLeft' && bel.valve==='open') || (e.code==='ArrowRight' && bel.valve==='close')) valve(null);
  const s = pc.seguradas[e.code]; if(!s) return;
  s.k.soltar(s.id); delete pc.seguradas[e.code];
});
window.addEventListener('blur', soltarTudo);

// Editar o mapa: toque um botão na tela e aperte a tecla (Esc termina, Delete tira a tecla do botão)
function interceptarToque(b, mao, k){
  if(pc.atribuindo){
    pc.alvo = {mao, id:b.id}; allKeyboards.forEach(x=>x.clearMarks()); k.mark(b.id,'guia',0);
    $('#pcAtribuirMsg').textContent = `Agora aperte a tecla para ${noteName(b[k.direcao()])} (${mao==='left'?'mão esquerda':'mão direita'}).`;
    return true;
  }
  if(midiCtl.ensinando!=null){
    midiCtl.mapa[midiCtl.ensinando] = {mao, id:b.id}; store.set('midiBotoes', midiCtl.mapa);
    $('#midiMsg').textContent = `A nota MIDI ${midiCtl.ensinando} agora toca ${noteName(b[k.direcao()])} (${mao==='left'?'mão esquerda':'mão direita'}).`;
    midiCtl.ensinando = null; renderMidi(); return true;
  }
  return false;
}
function atribuirTecla(e){
  e.preventDefault();
  if(e.code==='Escape'){ pararAtribuir(); return; }
  if(!pc.alvo){ $('#pcAtribuirMsg').textContent = 'Primeiro toque um botão do bandoneon na tela.'; return; }
  const antiga = teclaDoBotao(pc.alvo.mao, pc.alvo.id); if(antiga) delete pc.mapa[antiga];
  if(e.code==='Delete' || e.code==='Backspace') $('#pcAtribuirMsg').textContent = 'Tecla removida deste botão. Toque outro botão ou aperte Esc.';
  else { pc.mapa[e.code] = {...pc.alvo}; $('#pcAtribuirMsg').textContent = `Pronto: a tecla ${rotuloTecla(e.code)} toca este botão. Toque outro botão ou aperte Esc.`; }
  salvarMapaPc();
}
function comecarAtribuir(){
  $('#ctlDialog').close(); pc.atribuindo = true; pc.alvo = null; if(!pc.ligado) ligarPc(true);
  go('teclado'); $('#pcAtribuir').hidden = false; $('#pcAtribuirMsg').textContent = 'Toque um botão do bandoneon na tela e depois aperte a tecla do computador que vai tocá-lo.';
}
function pararAtribuir(){ pc.atribuindo = false; pc.alvo = null; $('#pcAtribuir').hidden = true; allKeyboards.forEach(x=>x.clearMarks()); }
$('#pcAtribuirFim').onclick = pararAtribuir;

function ligarPc(sim){
  pc.ligado = sim; store.set('pcLigado', sim); soltarTudo(); marcarTodas();
  $('#pcBtn').classList.toggle('on', sim); $('#pcLigado').checked = sim;
  // com o teclado ligado, a válvula sai do A e do F e vai para as setas
  $('#valveOpenBtn').textContent = sim ? 'Válvula: abrir (segure ←)' : 'Válvula: abrir (segure A)';
  $('#valveCloseBtn').textContent = sim ? 'Válvula: fechar (segure →)' : 'Válvula: fechar (segure F)';
}
$('#pcBtn').onclick = ()=>ligarPc(!pc.ligado);
$('#pcLigado').onchange = e=>ligarPc(e.target.checked);
$('#pcEditar').onclick = comecarAtribuir;
$('#pcPadrao').onclick = ()=>{ if(confirm(t('Voltar ao mapa padrão das teclas?'))){ pc.mapa = mapaPcPadrao(); salvarMapaPc(); } };

// Desenho do mapa: as fileiras do teclado do computador com a nota de cada tecla (na direção atual do fole)
function renderMapaPc(){
  const box = $('#pcMapa'); if(!box) return;
  const dir = pc.verDir || state.dir, fileiras = [0,1,2,3].map(i=>[...FILEIRAS_PC.left[i], ...FILEIRAS_PC.right[i]]);
  const outras = Object.keys(pc.mapa).filter(c=>!fileiras.flat().includes(c));
  const tecla = c => { const m = pc.mapa[c], b = m && state.layout[m.mao].find(x=>x.id===m.id);
    return `<span class="pc-tecla ${m?m.mao:'livre'}"><b>${rotuloTecla(c)}</b><small>${b ? noteName(b[dir]) : '–'}</small></span>`; };
  box.innerHTML = fileiras.map((f,i)=>`<div class="pc-fileira" style="--recuo:${i*14}px">${f.map(tecla).join('')}</div>`).join('')
    + (outras.length ? `<div class="pc-fileira pc-outras">${outras.map(tecla).join('')}</div>` : '');
  $('#pcMapaDir').textContent = dir==='open' ? 'Notas com o fole abrindo' : 'Notas com o fole fechando';
}
$('#pcMapaTroca').onclick = ()=>{ pc.verDir = (pc.verDir || state.dir)==='open' ? 'close' : 'open'; renderMapaPc(); };

/* ---------- Pressão do fole ---------- */
function mostrarPressao(){
  const v = Math.round(pressaoFole*100);
  $$('.pressao-in').forEach(i=>{ i.value = v; }); $$('.pressao-val').forEach(s=>{ s.textContent = v + '%'; });
  const b = $('#bellows'); if(b) b.style.setProperty('--pressao', pressaoFole);
}
$$('.pressao-in').forEach(i=>i.addEventListener('input', e=>setPressao(e.target.value/100)));
document.addEventListener('pressao-fole', mostrarPressao);

/* ---------- Controlador MIDI ---------- */
const midiCtl = {acesso:null, ligado:false, mapa: store.get('midiBotoes', {}), cc: store.get('midiCC', {pressao:null, fole:null}),
                 forca: store.get('midiForca', true), aprendendo:null, ensinando:null, seguradas:{}};
async function ligarMidi(){
  if(!navigator.requestMIDIAccess){ $('#midiMsg').textContent = 'Este navegador não aceita controladores MIDI. Use o Chrome ou o Edge no computador.'; return; }
  try{ midiCtl.acesso = await navigator.requestMIDIAccess(); }
  catch(e){ $('#midiMsg').textContent = 'Não foi possível acessar o controlador MIDI (permissão negada).'; return; }
  const ouvir = ()=>midiCtl.acesso.inputs.forEach(i=>{ i.onmidimessage = midiMensagem; });
  ouvir(); midiCtl.acesso.onstatechange = ()=>{ ouvir(); renderMidi(); };
  midiCtl.ligado = true; renderMidi();
}
function midiMensagem(ev){
  const [s, d1, d2] = ev.data, tipo = s & 0xf0;
  if(tipo===0x90 && d2>0) midiNota(d1, d2/127);
  else if(tipo===0x80 || (tipo===0x90 && d2===0)) midiSolta(d1);
  else if(tipo===0xB0) midiControle(d1, d2/127);
}
function midiNota(n, forca){
  if(midiCtl.ensinando===true){ midiCtl.ensinando = n; $('#midiMsg').textContent = `Nota MIDI ${n} recebida. Agora toque, na tela, o botão que ela deve tocar.`; return; }
  let alvo = null;
  const m = midiCtl.mapa[n];
  if(m){ const k = tecladoVisivel(m.mao); if(k) alvo = {k, id:m.id}; }
  // sem botão ensinado: procura um botão que dê essa nota na direção atual do fole (agudos na direita primeiro)
  if(!alvo) for(const lado of n>=60 ? ['right','left'] : ['left','right']){
    const k = tecladoVisivel(lado); if(!k) continue;
    const b = state.layout[lado].find(x=>x[k.direcao()]===n); if(b){ alvo = {k, id:b.id}; break; }
  }
  if(!alvo){ $('#midiMsg').textContent = `${noteName(n)} não existe nesta direção do fole nos teclados desta tela.`; return; }
  alvo.k.tocar(alvo.id, midiCtl.forca ? forca : 1); midiCtl.seguradas[n] = alvo;
}
function midiSolta(n){ const a = midiCtl.seguradas[n]; if(a){ a.k.soltar(a.id); delete midiCtl.seguradas[n]; } }
function midiControle(cc, v){
  if(midiCtl.aprendendo){
    midiCtl.cc[midiCtl.aprendendo] = cc; store.set('midiCC', midiCtl.cc);
    $('#midiMsg').textContent = midiCtl.aprendendo==='pressao' ? `Pronto: o controle ${cc} muda a pressão do fole.` : `Pronto: o controle ${cc} troca a direção do fole.`;
    midiCtl.aprendendo = null; renderMidi(); return;
  }
  if(cc===midiCtl.cc.pressao) setPressao(v);
  if(cc===midiCtl.cc.fole) trocarFole(v>=0.5 ? 'close' : 'open'); // pedal ou botão apertado = fechando
}
// troca a direção do fole na aba aberta
function trocarFole(d){
  if(currentView==='teclado' && state.dir!==d) setDir(d);
  else if(currentView==='melodias' && mel.dir!==d && !$('#melAuto').checked) setMelDir(d);
  else if(currentView==='academia' && acad.dir!==d && !acadFoleAuto()) acadSetDir(d);
}
function renderMidi(){
  const ent = midiCtl.acesso ? [...midiCtl.acesso.inputs.values()].map(i=>i.name) : [];
  $('#midiLigar').textContent = midiCtl.ligado ? 'MIDI ligado' : 'Ligar o controlador MIDI';
  $('#midiLigar').classList.toggle('on', midiCtl.ligado);
  $('#midiAparelhos').textContent = !midiCtl.ligado ? '' : ent.length ? `Conectado: ${ent.join(', ')}` : 'Nenhum controlador encontrado. Conecte o cabo e espere um pouco.';
  $('#midiCcPressao').textContent = midiCtl.cc.pressao!=null ? `Controle ${midiCtl.cc.pressao}` : 'nenhum';
  $('#midiCcFole').textContent = midiCtl.cc.fole!=null ? `Controle ${midiCtl.cc.fole}` : 'nenhum';
  $('#midiEnsinados').textContent = `${Object.keys(midiCtl.mapa).length} botão(ões) ensinado(s)`;
  $('#midiForca').checked = midiCtl.forca;
}
$('#midiLigar').onclick = ligarMidi;
$('#midiAprPressao').onclick = ()=>{ midiCtl.aprendendo = 'pressao'; $('#midiMsg').textContent = 'Mova agora o controle (pedal, roda ou botão giratório) que vai mudar a pressão do fole.'; };
$('#midiAprFole').onclick = ()=>{ midiCtl.aprendendo = 'fole'; $('#midiMsg').textContent = 'Aperte agora o pedal ou botão que vai trocar a direção do fole.'; };
$('#midiEnsinar').onclick = ()=>{ midiCtl.ensinando = true; $('#ctlDialog').close(); go('teclado'); $('#midiMsg').textContent = 'Toque uma nota no controlador MIDI.';
  avisar(`<span>${t('Toque uma nota no controlador MIDI e depois o botão da tela que ela deve tocar.')}</span>`, 6000); };
$('#midiApagar').onclick = ()=>{ midiCtl.mapa = {}; store.set('midiBotoes', {}); renderMidi(); };
$('#midiForca').onchange = e=>{ midiCtl.forca = e.target.checked; store.set('midiForca', midiCtl.forca); };

/* ---------- Janela "Controles de tocar" ---------- */
function abrirControles(){ pc.verDir = null; renderMapaPc(); renderMidi(); mostrarPressao(); $('#ctlDialog').showModal(); }
$$('[data-controles]').forEach(b=>b.addEventListener('click', abrirControles));
$('#ctlFechar').onclick = ()=>$('#ctlDialog').close();

ligarPc(pc.ligado); mostrarPressao();
