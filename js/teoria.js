/* ================== Teoria musical (aba Aprender → Teoria) e desafio Pauta no bandoneon ================== */
// Aqui fica o que o resto do app usa logo na abertura: a pauta (pautaSVG, usada no Início e nos desafios), o
// carregador da aba Teoria e o desafio Pauta no bandoneon. A pauta é desenhada aqui mesmo (pautaSVG): posição
// diatônica d = oitava*7 + letra (Dó=0 … Si=6), como em desafios.js; a linha de baixo é Mi4 (d=30) na
// clave de sol e Sol2 (d=18) na clave de fá.
state.progress.teoria = state.progress.teoria || {};
const BASE_CLAVE = {sol:30, fa:18};
const yPauta = (clave, d) => 100 - (d - BASE_CLAVE[clave])*6;
const dDoMidi = m => { const pc = ((m%12)+12)%12; return {d:(Math.floor(m/12)-1)*7 + SHARP_LETTER[pc], acc:SHARP_ACC[pc]}; };
// notas: [{d, acc (1 = ♯, -1 = ♭), cls, x (opcional), vazia (cabeça branca)}]
function pautaSVG(clave, notas, W=360){
  const base = BASE_CLAVE[clave], Y = d => yPauta(clave, d);
  let s = `<svg class="pauta" viewBox="0 0 ${W} 150" role="img" aria-label="${clave==='sol' ? t('Clave de sol') : t('Clave de fá')}">`;
  for(let i=0;i<5;i++) s += `<line x1="8" x2="${W-8}" y1="${100-i*12}" y2="${100-i*12}" class="pl"/>`;
  s += clave==='sol' ? `<text x="12" y="110" font-size="72" class="pc">𝄞</text>` : `<text x="14" y="90" font-size="50" class="pc">𝄢</text>`;
  const x0 = 92, passo = notas.length>1 ? Math.min(46, (W-x0-24)/(notas.length-1)) : 0;
  notas.forEach((n, i)=>{
    const x = n.x ?? x0 + i*passo, y = Y(n.d), cima = n.d < base+4;
    let g = '';
    for(let k=base-2; k>=n.d; k-=2) g += `<line x1="${x-13}" x2="${x+13}" y1="${Y(k)}" y2="${Y(k)}" class="pl"/>`;
    for(let k=base+10; k<=n.d; k+=2) g += `<line x1="${x-13}" x2="${x+13}" y1="${Y(k)}" y2="${Y(k)}" class="pl"/>`;
    if(n.acc) g += `<text x="${x-22}" y="${y+6}" font-size="20" class="pc">${n.acc>0?'♯':'♭'}</text>`;
    g += `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.5" transform="rotate(-20 ${x} ${y})" class="${n.vazia?'cab-vazia':'cab'}"/>`;
    if(!n.semHaste) g += cima ? `<line x1="${x+7}" x2="${x+7}" y1="${y}" y2="${y-34}" class="ph"/>` : `<line x1="${x-7}" x2="${x-7}" y1="${y}" y2="${y+34}" class="ph"/>`;
    s += `<g class="nota ${n.cls||''}" data-i="${i}">${g}</g>`;
  });
  return s + '</svg>';
}
/* ---------- A aba Teoria: 16 tópicos em 3 módulos, baixados quando a aba abre ---------- */
// O conteúdo (textos, frases, laboratórios, o teclado em SVG e o teste com a caixa "Por quê") fica em arquivos
// que só carregam aqui, para não pesar na abertura do app: teoria-textos.js, teoria-frases.js, teoria-kit.js,
// teoria-topicos.js e css/teoria.css. O sw.js guarda todos em ARQUIVOS, então a teoria funciona sem internet.
// Os caminhos partem do endereço deste arquivo, porque as páginas es/ e en/ carregam o app com "../".
const BASE_APP = ((document.currentScript && document.currentScript.src) || '').replace(/js\/teoria\.js(\?.*)?$/, '');
const TEORIA_ARQUIVOS = ['js/teoria-textos.js', 'js/teoria-frases.js', 'js/teoria-kit.js', 'js/teoria-topicos.js'];
let teoriaAtual = 0, teoriaPronta = null;
function carregarTeoria(){
  if(teoriaPronta) return teoriaPronta;
  teoriaPronta = new Promise((ok, falha)=>{
    let faltam = TEORIA_ARQUIVOS.length + 1; const um = ()=>{ if(--faltam===0) ok(); };
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = BASE_APP + 'css/teoria.css';
    css.onload = um; css.onerror = um; document.head.appendChild(css); // sem o CSS a teoria ainda funciona
    TEORIA_ARQUIVOS.forEach(src=>{ const s = document.createElement('script'); s.src = BASE_APP + src; s.async = false; // async=false: executam na ordem
      s.onload = um; s.onerror = ()=>{ teoriaPronta = null; falha(new Error(src)); }; document.head.appendChild(s); });
  });
  return teoriaPronta;
}
function mostrarTeoria(){
  const raiz = $('#teoriaApp'); if(!raiz) return;
  if(typeof renderTeoria === 'function'){ renderTeoria(); return; }
  raiz.innerHTML = `<p class="muted">${t('Carregando a teoria…')}</p>`;
  carregarTeoria().then(()=>{ if(currentView==='teoria') renderTeoria(); })
    .catch(()=>{ raiz.innerHTML = `<p class="feedback bad">${t('Não deu para carregar a teoria. Confira a internet e tente de novo.')}</p>`; });
}
ganchosAba.push(v=>{ if(v==='teoria') mostrarTeoria(); });
// i: a posição do tópico (0 = o primeiro) ou o id ('intervalos'); a teoria resolve o id quando carrega
function abrirTeoria(i){ teoriaAtual = i; go('teoria'); }

/* ---------- Desafio: Pauta no bandoneon ---------- */
// A nota aparece na pauta (clave de sol para a mão direita, de fá para a esquerda) e o aluno toca o
// botão que dá essa nota na direção indicada. Dez rodadas; depois de dois erros o botão certo brilha.
const pq = {round:0, score:0, dir:'open', hand:'right', answer:null, target:null, errors:0, active:false, hist:[]};
state.progress.pautabot = state.progress.pautabot ?? null;
const pOpts = {getDir:()=>pq.dir, onPress:(b,m,dir,k)=>pautaPress(b,m,k)};
const pkL = kb($('#pkLeft'),'left',pOpts), pkR = kb($('#pkRight'),'right',pOpts);
const FAIXA_PAUTA = {right:[55,84], left:[38,64]}; // o que dá para ler sem muitas linhas suplementares
function pautaFeed(msg, cls=''){ const f = $('#pFeed'); f.className = 'feedback '+cls; f.textContent = msg; }
function desenhaPautaDesafio(cls){
  const clave = pq.hand==='left' ? 'fa' : 'sol';
  $('#pPauta').innerHTML = pq.target==null ? pautaSVG(clave, [], 300) : pautaSVG(clave, [{...dDoMidi(pq.target), cls}], 300);
}
function nextPauta(){
  pkL.clearMarks(); pkR.clearMarks();
  if(pq.round>=10){
    pq.active = false; $('#pDirPill').style.visibility = 'hidden'; menuPratica('p', false);
    pautaFeed(`Fim! ${pq.score}/10`, pq.score>=8?'ok':''); placarBolinhas('p', pq.hist, pq.round, pq.score, false);
    if(state.progress.pautabot==null || pq.score>state.progress.pautabot){ state.progress.pautabot = pq.score; saveProgress(); }
    logPractice('desafio'); if(pq.score>=8) comemorar(); return;
  }
  pq.hand = $('#pHand').value; pq.dir = $('#pDir').value==='rand' ? pick(['open','close']) : $('#pDir').value;
  const [lo, hi] = FAIXA_PAUTA[pq.hand], todas = $('#pNotas').value==='todas';
  const L = state.layout[pq.hand].filter(b=>b[pq.dir]>=lo && b[pq.dir]<=hi && (todas || NATURAIS.includes(((b[pq.dir]%12)+12)%12)));
  let b; do{ b = pick(L); }while(L.length>1 && b===pq.answer);
  Object.assign(pq, {answer:b, target:b[pq.dir], errors:0});
  pkL.setDim(pq.hand!=='left'); pkR.setDim(pq.hand!=='right'); pkL.refresh(); pkR.refresh();
  const p = $('#pDirPill'); p.style.visibility = 'visible'; p.className = 'dirpill ' + pq.dir; p.textContent = `${dirLabel(pq.dir)} · ${maoNome(pq.hand)}`;
  placarBolinhas('p', pq.hist, pq.round, pq.score, true);
  pautaFeed('Leia a nota e toque o botão.'); desenhaPautaDesafio('entra');
}
function pautaPress(b, m, k){
  if(!pq.active) return;
  if(k.hand!==pq.hand){ pautaFeed('Essa nota está na outra mão.', 'bad'); return; }
  if(m===pq.target){
    k.mark(b.id,'ok'); pq.score += pq.errors===0 ? 1 : 0; pq.hist.push(pq.errors===0 ? 'certa' : 'meia'); pq.round++; placarBolinhas('p', pq.hist, pq.round, pq.score, true);
    pautaFeed(pq.errors ? 'Achou! (não conta ponto por ter errado antes)' : `Certo! ${noteName(m)}`, 'ok'); desenhaPautaDesafio('certa');
    setTimeout(nextPauta, 900);
  } else {
    pq.errors++; k.mark(b.id,'bad'); desenhaPautaDesafio('errada');
    pautaFeed(`Esse é ${noteName(m)}. Tente de novo.`, 'bad');
    if(pq.errors>=2) k.mark(pq.answer.id,'hint',0);
  }
}
$('#pStart').onclick = ()=>{ ac(); Object.assign(pq, {round:0, score:0, active:true, answer:null, hist:[]}); menuPratica('p', true); nextPauta(); };
function pararPauta(){
  pq.active = false; pkL.clearMarks(); pkR.clearMarks(); pkL.setDim(false); pkR.setDim(false); pkL.refresh(); pkR.refresh();
  $('#pDirPill').style.visibility = 'hidden'; pautaFeed(''); pq.target = null; desenhaPautaDesafio(); $('#pHud').hidden = true; menuPratica('p', false);
}
$('#pParar').onclick = pararPauta;
segmentar($('#pHand'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'}); segmentar($('#pDir'), {rotulo:rotuloFole}); segmentar($('#pNotas'), {rotulo:rotuloExplicado, classe:'menu-seg-2l'});
desenhaPautaDesafio();
