/* ================== Navegação ================== */
// Além do Início, o app tem 4 áreas: Aprender, Tocar, Treinar e Perfil. Cada área junta algumas
// abas (as <section id="v-…">), que aparecem como pílulas no topo (#subnav). No computador as áreas
// ficam no menu lateral; no celular, na barra de baixo. Tocar numa área volta à última aba usada nela.
const AREAS = {
  inicio:['inicio'], aprender:['estudo','academia','licoes','teoria'], tocar:['teclado','melodias','acordes','microfone'],
  treinar:['desafios','eco','ritmo'], professores:['professor','relatorios','turmas'],
  perfil:['conta','perfil','ajustes'], // "Você": sem botão no menu; abre pelo Entrar / círculo da conta no topo (js/conta.js)
};
const areaDe = v => Object.keys(AREAS).find(a=>AREAS[a].includes(v)) || 'inicio';
const ultimaAba = store.get('ultimaAba', {});
// Outras partes do app avisam aqui o que fazer ao abrir ou sair de uma aba: ganchosAba.push((nova, anterior)=>…)
const ganchosAba = [];
let currentView='inicio';
// Mostra a aba v e para o que estiver tocando nas outras
function go(v){
  if(!$('#v-'+v)) v='inicio';
  const anterior=currentView, area=areaDe(v);
  currentView=v;
  if(area!=='inicio'){ ultimaAba[area]=v; store.set('ultimaAba', ultimaAba); }
  $$('#nav [data-area]').forEach(b=>{ const on=b.dataset.area===area; b.classList.toggle('active',on); b.toggleAttribute('aria-current',on); });
  const sub=$('#subnav'); sub.hidden = AREAS[area].length<2;
  const vSub = v==='teoria' ? 'licoes' : v; // Teoria é a segunda trilha da aba Lições
  $$('#subnav [data-v]').forEach(b=>{
    const on=b.dataset.v===vSub; b.hidden = b.dataset.area!==area;
    b.classList.toggle('active',on); b.setAttribute('aria-selected',on); b.toggleAttribute('aria-current',on);
  });
  $$('main>section').forEach(s=>s.classList.toggle('active',s.id==='v-'+v));
  construirPendentes(); // teclados desta aba que ainda não foram desenhados
  moverIndicador();
  if(v!=='ritmo' && rh.playing) toggleRhythm();
  if(v!=='melodias' && mel.running) stopMelody();
  if(v!=='academia' && (acad.rodando || acad.demo)) acadParar();
  if(v==='academia') acadMostrar(); // os teclados só têm largura quando a aba está visível
  ganchosAba.forEach(f=>f(v, anterior));
  if(v!==anterior){ cascata($('#v-'+v)); deslizarAba($('#v-'+v), anterior, v); }
  window.scrollTo(0,0);
}
// O fundo dourado da área ativa desliza até o botão tocado
function moverIndicador(){
  const b=$('#nav [data-area].active'), ind=$('#navInd'); if(!ind) return;
  if(!b || !b.offsetWidth){ ind.style.opacity=0; return; } // na área da conta nenhum botão do menu fica aceso
  ind.style.opacity=1; ind.style.width=b.offsetWidth+'px'; ind.style.height=b.offsetHeight+'px';
  ind.style.transform=`translate(${b.offsetLeft}px,${b.offsetTop}px)`;
}
window.addEventListener('resize', moverIndicador);
if(document.fonts && document.fonts.ready) document.fonts.ready.then(moverIndicador);
$('#nav').addEventListener('click',e=>{
  const b=e.target.closest('[data-area]'); if(!b) return;
  const a=b.dataset.area, ult=ultimaAba[a];
  go(AREAS[a].includes(ult) ? ult : AREAS[a][0]);
});
$('#subnav').addEventListener('click',e=>{ const b=e.target.closest('[data-v]'); if(b) go(b.dataset.v); });
// setas do teclado do computador trocam de aba dentro da área
$('#subnav').addEventListener('keydown',e=>{
  if(e.key!=='ArrowRight' && e.key!=='ArrowLeft') return;
  const abas=$$('#subnav [data-v]').filter(b=>!b.hidden), i=abas.findIndex(b=>b.dataset.v===currentView);
  const prox=abas[(i+(e.key==='ArrowRight'?1:abas.length-1))%abas.length]; if(prox){ go(prox.dataset.v); prox.focus(); }
});
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(g.dataset.go); }
});
// Trocar Dó Ré Mi ↔ C D E redesenha tudo o que mostra nomes de notas
// Redesenha o que o código monta com nomes de notas ou textos do idioma (ao trocar notas ou idioma)
function rerenderTextos(){
  refreshAll(); renderLesson(); renderStaffAnswers(); if(fq.active) showFindTarget();
  if(mel.cur && !mel.running){ const g=mel.cur.guide; if(g) loadScale(g.type,g.pc,g.hand,g.octs,g.start,g.dirMode); else renderMelPlayer(); }
  renderMelList(); fillScaleTonics(); fillChordSelects(); showChord(); renderProgress();
}
$('#namesSel').onchange=e=>{ state.names=e.target.value; store.set('names',state.names); rerenderTextos(); };

/* ================== Progresso ================== */
// Anel de progresso: f vai de 0 a 1 (o círculo tem raio 15, perímetro ≈ 94,2)
function anel(id, f){ const c=$('#'+id); if(!c) return; f=Math.max(0,Math.min(1,f||0));
  c.style.strokeDasharray = `${(f*94.2).toFixed(1)} 100`; c.style.opacity = f>0 ? 1 : 0; } // vazio: sem o pontinho da ponta redonda
// Atualiza a tela inicial (chamada sempre que o progresso é salvo)
function renderProgress(){
  const n=LESSONS.length, done=LESSONS.filter((_,i)=>state.progress.lessons[i]).length, p=state.progress;
  $('#pLessons').textContent=`${done}/${n}`; anel('aLessons', done/n);
  $('#pFind').textContent = p.find!=null ? p.find+'/10' : '–'; anel('aFind', p.find/10);
  $('#pStaff').textContent = p.staff!=null ? p.staff+'/10' : '–'; anel('aStaff', p.staff/10);
  $('#pRhythm').textContent = p.rhythm!=null ? p.rhythm+'%' : '–'; anel('aRhythm', p.rhythm/100);
  const md=Object.keys(p.melodies||{}).length;
  $('#pMel').textContent = md ? md : '–';
  $('#pChords').textContent = p.chords!=null ? p.chords+'/10' : '–'; anel('aChords', p.chords/10);
  if(typeof renderRoutine==='function') renderRoutine();
  if(typeof renderContinuar==='function') renderContinuar();
  if(typeof renderTrilha==='function'){ renderTrilha(); checarConquistas(); }
}
