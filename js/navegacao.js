/* ================== Navegação ================== */
let currentView='inicio';
// Mostra a aba v e para o que estiver tocando nas outras
function go(v){
  currentView=v;
  $$('#nav button').forEach(b=>{ b.classList.toggle('active',b.dataset.v===v); b.toggleAttribute('aria-current', b.dataset.v===v); });
  $$('main>section').forEach(s=>s.classList.toggle('active',s.id==='v-'+v));
  if(v!=='ritmo' && rh.playing) toggleRhythm();
  if(v!=='melodias' && mel.running) stopMelody();
  window.scrollTo(0,0);
}
$('#nav').addEventListener('click',e=>{ if(e.target.dataset.v) go(e.target.dataset.v); });
document.addEventListener('click',e=>{ const g=e.target.closest('[data-go]'); if(g){ e.preventDefault(); go(g.dataset.go); } });
// Trocar Dó Ré Mi ↔ C D E redesenha tudo o que mostra nomes de notas
$('#namesSel').onchange=e=>{ state.names=e.target.value; store.set('names',state.names); refreshAll(); renderLesson(); renderStaffAnswers(); if(fq.target!=null) showFindTarget(); if(mel.cur && !mel.running) renderMelPlayer(); if($('#scaleCard').style.display!=='none') fillScaleTonics(); fillChordSelects(); showChord(); };

/* ================== Progresso ================== */
// Atualiza a tela inicial (chamada sempre que o progresso é salvo)
function renderProgress(){
  const n=LESSONS.length, done=LESSONS.filter((_,i)=>state.progress.lessons[i]).length;
  $('#pLessons').textContent=`${done}/${n}`; $('#pLessonsBar').style.width=(100*done/n)+'%';
  $('#pFind').textContent = state.progress.find!=null ? state.progress.find+'/10' : '–';
  $('#pStaff').textContent = state.progress.staff!=null ? state.progress.staff+'/10' : '–';
  $('#pRhythm').textContent = state.progress.rhythm!=null ? state.progress.rhythm+'%' : '–';
  const md=Object.keys(state.progress.melodies||{}).length;
  $('#pMel').textContent = md ? md : '–';
  $('#pChords').textContent = state.progress.chords!=null ? state.progress.chords+'/10' : '–';
  if(typeof renderRoutine==='function') renderRoutine();
}
