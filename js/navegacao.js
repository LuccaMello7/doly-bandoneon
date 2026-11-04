/* ================== Navegação ================== */
// No computador o menu fica na lateral. No celular e no tablet vira uma barra embaixo com as abas
// principais (class="principal") e o botão "Mais", que abre as outras abas por cima da barra.
let currentView='inicio';
// Mostra a aba v e para o que estiver tocando nas outras
function go(v){
  currentView=v;
  $$('#nav [data-v]').forEach(b=>{ b.classList.toggle('active',b.dataset.v===v); b.toggleAttribute('aria-current', b.dataset.v===v); });
  const principal = !!$(`#nav [data-v="${v}"].principal`);
  $('#navMais').classList.toggle('active', !principal); abrirMais(false);
  $$('main>section').forEach(s=>s.classList.toggle('active',s.id==='v-'+v));
  if(v!=='ritmo' && rh.playing) toggleRhythm();
  if(v!=='melodias' && mel.running) stopMelody();
  if(v!=='academia' && (acad.rodando || acad.demo)) acadParar();
  if(v==='academia') acadMostrar(); // os teclados só têm largura quando a aba está visível
  window.scrollTo(0,0);
}
function abrirMais(abrir){ $('#nav').classList.toggle('aberto', abrir); $('#navMais').setAttribute('aria-expanded', abrir); }
$('#nav').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b) return;
  if(b.id==='navMais') abrirMais(!$('#nav').classList.contains('aberto'));
  else if(b.dataset.v) go(b.dataset.v);
});
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(g.dataset.go); return; }
  if(!e.target.closest('#nav')) abrirMais(false); // tocar fora fecha o "Mais"
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
}
