/* ================== Lições ================== */
const LESSONS = [
{ title:'1. O que é o bandoneon', html:`
  <p>O bandoneon é um instrumento de palheta livre e fole, da família da concertina. Foi desenvolvido na Alemanha por volta de 1840 e leva o nome de <b>Heinrich Band</b>, comerciante de instrumentos de Krefeld que ajudou a difundi-lo.</p>
  <p>Era usado originalmente em música religiosa e popular alemã. No fim do século XIX chegou ao Rio da Prata (Buenos Aires e Montevidéu) com os imigrantes e acabou virando <b>a voz do tango</b>.</p>
  <p>Alguns nomes para ouvir: <b>Pedro Maffia, Pedro Laurenz, Aníbal Troilo, Astor Piazzolla, Leopoldo Federico</b> e <b>Dino Saluzzi</b>.</p>`,
  quiz:[{q:'Em qual país o bandoneon foi desenvolvido?',o:['Argentina','Alemanha','Itália','Uruguai'],a:1},
        {q:'Com qual gênero musical o bandoneon ficou mais associado?',o:['Samba','Fado','Tango','Flamenco'],a:2}]},
{ title:'2. Anatomia do instrumento', html:`
  <ul>
    <li><b>Duas caixas</b> (tampas), uma em cada mão, com os <b>botões</b>.</li>
    <li><b>Fole</b> no meio: ao abrir ou fechar, empurra o ar pelas palhetas.</li>
    <li><b>Palhetas (lengüetas)</b>: lâminas de metal que vibram. Em cada nota normalmente soam duas, afinadas em oitava, o que dá o timbre encorpado.</li>
    <li><b>Válvula de ar</b>: alavanca acionada pelo polegar direito. Deixa o ar entrar ou sair sem som, para reposicionar o fole.</li>
    <li><b>Correias</b>: prendem as mãos às caixas.</li>
  </ul>
  <p>No bandoneon "argentino" clássico (sistema Rheinische) são <b>71 botões</b>: 38 na mão direita e 33 na esquerda. Como cada botão dá duas notas, são <b>142 vozes</b>.</p>`,
  quiz:[{q:'Para que serve a válvula de ar?',o:['Afinar o instrumento','Mover o fole sem produzir som','Deixar o som mais alto','Trocar de oitava'],a:1},
        {q:'Por que um bandoneon de 71 botões é chamado de "142 vozes"?',o:['Cada botão dá uma nota abrindo e outra fechando','Ele tem 142 palhetas por botão','São 142 botões ao todo','Por causa das duas oitavas'],a:0}]},
{ title:'3. Bisonoro: abrindo e fechando', html:`
  <p>Esta é a característica que mais assusta quem começa: o bandoneon tradicional é <b>bisonoro</b>. O <b>mesmo botão</b> dá uma nota quando você <b>abre</b> o fole e <b>outra</b> quando <b>fecha</b>.</p>
  <p>Ou seja, você precisa aprender <b>quatro mapas</b>: mão direita abrindo, mão direita fechando, mão esquerda abrindo e mão esquerda fechando.</p>
  <p><b>Exercício:</b> toque 3 botões abrindo, troque a direção e toque 3 fechando. Repare como a nota muda.</p>
  <div id="lessonKbd"></div>`,
  quiz:[{q:'Num bandoneon bisonoro, o que acontece quando você aperta o mesmo botão abrindo e depois fechando?',o:['Toca a mesma nota','Toca notas diferentes','Só funciona abrindo','A nota sobe uma oitava'],a:1}]},
{ title:'4. Fole e expressão', html:`
  <p>O fole é o seu "arco de violino": é ele que controla <b>volume, ataque e expressão</b>. Os dedos só escolhem as notas.</p>
  <ul>
    <li>Mais pressão no fole: som mais forte. Pressão leve: <i>piano</i>.</li>
    <li>Planeje <b>onde trocar a direção</b>, de preferência entre frases ou em pausas, como um cantor planeja a respiração.</li>
    <li>Se o fole chegar ao fim, use a <b>válvula de ar</b> para reposicioná-lo em silêncio.</li>
    <li>Nunca force o fole sem apertar botões nem a válvula, porque isso danifica o instrumento.</li>
  </ul>
  <p>Na aba <a href="#" data-go="teclado">Teclado</a> o fole é simulado: se você tocar muito tempo na mesma direção, ele chega ao fim. Use <kbd>Espaço</kbd> para trocar a direção. Para reposicionar o fole em silêncio, segure <kbd>A</kbd> (válvula abrindo) ou <kbd>F</kbd> (válvula fechando).</p>`,
  quiz:[{q:'O que controla principalmente o volume e a expressão no bandoneon?',o:['A força dos dedos nos botões','O fole','A válvula de ar','As correias'],a:1},
        {q:'O fole está quase todo aberto e a frase ainda não acabou. O melhor seria…',o:['Forçar mais','Ter planejado a troca antes, ou usar a válvula numa pausa','Soltar as correias','Tocar mais rápido'],a:1}]},
{ title:'5. Leitura: duas claves', html:`
  <p>As partituras de bandoneon usam um <b>sistema de duas pautas</b>, como no piano:</p>
  <ul><li><b>Clave de sol</b>: mão direita (agudos).</li><li><b>Clave de fá</b>: mão esquerda (graves).</li></ul>
  <p>Na clave de sol, as linhas de baixo para cima são <b>Mi, Sol, Si, Ré, Fá</b>. Na clave de fá, <b>Sol, Si, Ré, Fá, Lá</b>.</p>
  <p>Treine em <a href="#" data-go="desafios">Desafios → Leitura na pauta</a>.</p>`,
  quiz:[{q:'Qual clave a mão esquerda costuma ler?',o:['Clave de sol','Clave de fá','Clave de dó','Nenhuma'],a:1},
        {q:'Qual nota fica na 2ª linha (de baixo para cima) da clave de sol?',o:['Mi','Sol','Si','Fá'],a:1}]},
{ title:'6. Ritmos do tango', html:`
  <p>O acompanhamento de tango gira em torno de poucos padrões:</p>
  <ul>
    <li><b>Marcato</b>: acordes curtos em cada tempo (em 4) ou nos tempos 1 e 3 (em 2).</li>
    <li><b>Síncopa</b>: acento deslocado para o contratempo, que empurra a música para frente.</li>
    <li><b>3-3-2</b>: as oito colcheias agrupadas em 3+3+2.</li>
    <li><b>Arrastre</b>: um "arrasto" que cresce até o tempo forte.</li>
  </ul>
  <p>Ouça e toque junto na aba <a href="#" data-go="ritmo">Ritmo</a>. Comece devagar (60–70 BPM).</p>`,
  quiz:[{q:'Como se agrupam as 8 colcheias no ritmo 3-3-2?',o:['4+4','2+2+2+2','3+3+2','3+2+3'],a:2},
        {q:'O que caracteriza a síncopa?',o:['Acento no contratempo','Notas longas','Só tempos fortes','Ausência de acentos'],a:0}]},
{ title:'7. Rotina de estudo', html:`
  <p>Uma rotina curta e diária rende mais que horas uma vez por semana. Sugestão de 20–30 minutos:</p>
  <ol>
    <li><b>5 min</b>: fole. Notas longas abrindo e fechando, com volume estável.</li>
    <li><b>10 min</b>: mapa de botões. Escalas lentas de Dó e Sol maior, uma mão por vez. Use as <a href="#" data-go="melodias">Escalas guiadas</a> no modo Espera e o desafio <i>Encontre a nota</i>.</li>
    <li><b>5 min</b>: ritmo. Marcato e síncopa com metrônomo.</li>
    <li><b>5–10 min</b>: repertório. Um trecho de tango simples, como "La Cumparsita" ou "El Choclo", bem devagar.</li>
  </ol>
  <p>Um professor presencial é muito importante para postura, correias e mecânica do fole, que um app não consegue corrigir.</p>`,
  quiz:[{q:'O que é mais eficiente no começo?',o:['Uma sessão longa por semana','Prática curta e diária','Só tocar músicas rápidas','Só teoria'],a:1}]},
];
let curLesson=0, lessonAnswered={}, lessonKb=null, lessonCount={open:0,close:0}, lessonDir='open';
function renderLessonList(){
  $('#lessonList').innerHTML='<h3 style="margin-top:0">Lições</h3>'+LESSONS.map((l,i)=>
    `<button data-i="${i}" class="${i===curLesson?'active':''}">${l.title}${state.progress.lessons[i]?'<span class="done">✓</span>':''}</button>`).join('');
}
$('#lessonList').addEventListener('click',e=>{ const b=e.target.closest('button'); if(b){ curLesson=+b.dataset.i; renderLesson(); } });
function renderLesson(){
  renderLessonList();
  const L=LESSONS[curLesson]; lessonAnswered={}; const answered=lessonAnswered;
  $('#lessonBody').innerHTML=`<h2>${L.title}</h2>${L.html}<h3>Verifique o que aprendeu</h3>`+
    L.quiz.map((q,qi)=>`<div class="q" data-q="${qi}"><div>${q.q}</div><div class="opts">${q.o.map((o,oi)=>`<button class="btn sec" data-o="${oi}">${o}</button>`).join('')}</div><div class="fb muted"></div></div>`).join('')+
    `<div class="row" style="margin-top:12px"><button class="btn sec" id="prevL" ${curLesson===0?'disabled':''}>← Anterior</button><button class="btn" id="nextL" ${curLesson===LESSONS.length-1?'disabled':''}>Próxima →</button></div>`;
  $$('#lessonBody .q').forEach(qe=>qe.addEventListener('click',e=>{
    const o=e.target.dataset.o; if(o==null) return;
    const qi=+qe.dataset.q, q=L.quiz[qi], btn=e.target;
    if(+o===q.a){ btn.classList.add('right'); qe.querySelector('.fb').textContent='Correto!'; answered[qi]=true; }
    else { btn.classList.add('wrong'); qe.querySelector('.fb').textContent='Ainda não, tente outra opção.'; }
    tryCompleteLesson();
  }));
  $('#prevL').onclick=()=>{ curLesson--; renderLesson(); };
  $('#nextL').onclick=()=>{ curLesson++; renderLesson(); };
  const host=$('#lessonKbd');
  if(host){
    lessonCount={open:0,close:0}; lessonDir='open';
    host.innerHTML=`<div class="row" style="margin:8px 0"><button class="btn" id="lDir">Direção: Abrindo (trocar)</button><span id="lCount" class="muted"></span></div><div id="lKb"></div>`;
    const idx=allKeyboards.indexOf(lessonKb); if(idx>=0) allKeyboards.splice(idx,1);
    lessonKb=kb($('#lKb'),'right',{getDir:()=>lessonDir, onPress:(b,m,dir)=>{ lessonCount[dir]++; updLessonCount(noteName(m)); tryCompleteLesson(); }});
    $('#lDir').onclick=()=>{ lessonDir=lessonDir==='open'?'close':'open'; $('#lDir').textContent=`Direção: ${dirLabel(lessonDir)} (trocar)`; lessonKb.refresh(); };
    updLessonCount();
  }
}
function tryCompleteLesson(){
  const L=LESSONS[curLesson];
  if(L.quiz.every((_,i)=>lessonAnswered[i]) && !state.progress.lessons[curLesson] && (!lessonNeedsExercise() || lessonExerciseDone())){
    state.progress.lessons[curLesson]=true; saveProgress(); renderLessonList();
  }
}
const lessonNeedsExercise=()=>!!LESSONS[curLesson].html.includes('lessonKbd');
const lessonExerciseDone=()=>lessonCount.open>=3 && lessonCount.close>=3;
function updLessonCount(last){
  const done=lessonExerciseDone();
  $('#lCount').innerHTML=`Abrindo: ${Math.min(3,lessonCount.open)}/3 · Fechando: ${Math.min(3,lessonCount.close)}/3 ${last?'· última: <b>'+last+'</b>':''} ${done?'✓ Exercício feito, agora responda a pergunta.':''}`;
}
