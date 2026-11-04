/* ================== Lições ================== */
// Cada lição é {title, html, quiz:[{q, o (opções), a (índice da certa)}]}.
// O progresso é salvo pelo ÍNDICE da lição: lições novas devem entrar no FIM da lista.
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
  <p>Uma rotina curta e diária rende mais que horas uma vez por semana. A <a href="#" data-go="inicio">tela inicial</a> mostra a sua <b>rotina de hoje</b> e quantos dias seguidos você praticou. Sugestão de 20–30 minutos:</p>
  <ol>
    <li><b>5 min</b>: fole. Notas longas abrindo e fechando, com volume estável.</li>
    <li><b>10 min</b>: mapa de botões. Escalas lentas de Dó e Sol maior, uma mão por vez. Use as <a href="#" data-go="melodias">Escalas guiadas</a> no modo Espera e o desafio <i>Encontre a nota</i>.</li>
    <li><b>5 min</b>: ritmo. Marcato e síncopa com metrônomo.</li>
    <li><b>5–10 min</b>: repertório. Uma melodia ou um trecho de tango importado (MusicXML), bem devagar, e os acordes do acompanhamento.</li>
  </ol>
  <p>Um professor presencial é muito importante para postura, correias e mecânica do fole, que um app não consegue corrigir.</p>`,
  quiz:[{q:'O que é mais eficiente no começo?',o:['Uma sessão longa por semana','Prática curta e diária','Só tocar músicas rápidas','Só teoria'],a:1}]},
{ title:'8. Articulação: legato, staccato e acentos', html:`
  <p>No bandoneon, a articulação vem da combinação entre <b>dedos</b> e <b>fole</b>:</p>
  <ul>
    <li><b>Legato</b> (ligado): uma nota emenda na outra, sem silêncio. O fole continua andando sem parar e os dedos trocam de botão no momento exato. É mais fácil quando as notas da frase estão na <b>mesma direção</b> do fole.</li>
    <li><b>Staccato</b> (destacado): notas curtas, com silêncio entre elas. O dedo solta o botão rápido; o fole pode continuar em movimento suave.</li>
    <li><b>Acento</b>: um impulso rápido do fole no início da nota (ou do acorde) faz ela soar mais forte. É o que dá peso ao <i>marcato</i>.</li>
    <li><b>Arrastre</b>: o som começa um pouco antes do tempo e cresce até o acento. Sai de um movimento de fole que acelera até o tempo forte.</li>
  </ul>
  <p>Experimente na aba <a href="#" data-go="teclado">Teclado</a>: toque uma escala ligada e depois destacada. Na aba <a href="#" data-go="ritmo">Ritmo</a>, ouça o padrão "Marcato com arrastre".</p>`,
  quiz:[{q:'O que produz o acento de um acorde no bandoneon?',o:['Apertar o botão com mais força','Um impulso rápido do fole','A válvula de ar','Trocar de mão'],a:1},
        {q:'Por que o legato é mais fácil com as notas na mesma direção do fole?',o:['Porque o fole não precisa parar para inverter','Porque as notas ficam mais agudas','Porque usa menos botões','Não faz diferença'],a:0}]},
{ title:'9. Acordes no bandoneon', html:`
  <p>Um acorde é formado por notas empilhadas em terças. O <b>maior</b> tem fundamental, terça maior e quinta (Dó-Mi-Sol). O <b>menor</b> tem a terça menor (Lá-Dó-Mi). O de <b>sétima</b> (dominante) acrescenta a sétima menor (Sol-Si-Ré-Fá) e "pede" para resolver no acorde seguinte.</p>
  <p>No bandoneon bisonoro, <b>cada acorde tem uma forma abrindo e outra fechando</b>, com botões diferentes. Por isso vale aprender os acordes mais usados nas duas direções.</p>
  <p>No acompanhamento de tango, a mão esquerda costuma tocar o <b>baixo</b> (fundamental) no tempo forte e o <b>acorde</b> nos outros tempos, ou o acorde inteiro em marcato.</p>
  <p>Na aba <a href="#" data-go="acordes">Acordes</a> você vê as formas de cada acorde no teclado, ouve e treina. Comece por Lám, Rém, Mi7 e Dó, muito comuns em tangos em Lá menor.</p>`,
  quiz:[{q:'Quais notas formam o acorde de Lá menor?',o:['Lá, Dó♯, Mi','Lá, Dó, Mi','Lá, Ré, Fá','Lá, Si, Dó'],a:1},
        {q:'No bandoneon bisonoro, um mesmo acorde…',o:['Usa sempre os mesmos botões','Tem uma forma abrindo e outra fechando','Só pode ser tocado abrindo','Só existe na mão direita'],a:1}]},
{ title:'10. Duas mãos, um fole só', html:`
  <p>As duas mãos dividem o <b>mesmo fole</b>. Isso tem duas consequências importantes:</p>
  <ol>
    <li>Num dado momento, <b>as duas mãos tocam na mesma direção</b>. Uma nota da melodia e um baixo tocados juntos precisam existir na mesma direção.</li>
    <li>Enquanto uma nota está <b>soando</b>, o fole não pode inverter, ou ela muda de altura no meio. Por isso a troca de direção acontece quando as duas mãos atacam juntas ou numa pausa.</li>
  </ol>
  <p>Como estudar: primeiro cada mão sozinha, depois as duas juntas bem devagar. Na aba <a href="#" data-go="melodias">Melodias</a>, abra a <i>Ode à Alegria a duas mãos</i> no modo Espera. O app planeja o fole para as duas mãos e mostra a partitura em pauta dupla.</p>`,
  quiz:[{q:'Melodia e baixo tocados ao mesmo tempo precisam estar…',o:['Em direções opostas do fole','Na mesma direção do fole','Na mesma mão','Em oitavas iguais'],a:1},
        {q:'O que acontece se o fole inverter enquanto uma nota está soando?',o:['Nada','A nota muda de altura','O som fica mais forte','O fole trava'],a:1}]},
{ title:'11. Como ler uma partitura de tango', html:`
  <p>Partituras para bandoneon solo geralmente usam <b>duas pautas</b> (sol para a direita, fá para a esquerda), como no piano. Nas partes de orquestra típica, o bandoneon muitas vezes tem <b>uma pauta só</b>, em clave de sol, com a melodia ou um contracanto. Os baixos ficam com o contrabaixo e o piano.</p>
  <p>O que procurar ao abrir um tango:</p>
  <ul>
    <li><b>Forma</b>: os tangos tradicionais costumam ter duas partes (A e B), e os mais antigos às vezes uma terceira (trio). Ache onde cada parte começa.</li>
    <li><b>Repetições</b>: barras de ritornelo, <i>D.C.</i> (volta ao começo), <i>D.S.</i> (volta ao sinal 𝄋), <i>Coda</i> (𝄌) e <i>Fine</i> (fim).</li>
    <li><b>Tonalidade e compasso</b>: muitos tangos estão em tom menor e em 2/4 ou 4/4.</li>
    <li><b>Indicações de caráter</b>: <i>marcato</i>, <i>legato</i>, <i>rall.</i> (desacelerando), <i>a tempo</i>, e dinâmicas como <i>p</i>, <i>f</i> e <i>sfz</i>.</li>
  </ul>
  <p>Dica: com uma partitura digital (MuseScore), exporte em MusicXML e use <a href="#" data-go="melodias">Melodias → Importar MusicXML</a> para praticar trecho a trecho. Prefira obras em domínio público ou partituras que você tem direito de usar.</p>`,
  quiz:[{q:'O que significa "D.C." numa partitura?',o:['Diminuir o volume','Voltar ao começo','Dobrar o compasso','Tocar com a mão direita'],a:1},
        {q:'Numa parte de orquestra típica, o bandoneon muitas vezes…',o:['Tem uma pauta só, em clave de sol','Não tem partitura','Lê só cifras','Usa clave de dó'],a:0}]},
];
// Tarefas tocadas dentro das lições ("toque agora…"). Cada passo é {mao, dir, midi}; midi null = qualquer
// botão daquela mão. Ficam fora do texto da lição para valer nos três idiomas sem repetir o HTML.
const TAREFAS_LICAO = {
  0: {intro:'O Lá é a nota que a orquestra usa para afinar.', passos:[{mao:'right', dir:'open', midi:69}]},
  1: {intro:'Sinta a diferença entre as duas caixas: graves na esquerda, agudos na direita.', passos:[{mao:'left', dir:'open', midi:null}, {mao:'right', dir:'open', midi:null}]},
  3: {intro:'A mesma nota pode estar em botões diferentes, conforme a direção do fole.', passos:[{mao:'right', dir:'open', midi:67}, {mao:'right', dir:'close', midi:67}]},
  4: {intro:'Na clave de sol, a 2ª linha é o Sol.', passos:[{mao:'right', dir:'open', midi:67}]},
  8: {intro:'Lá, Dó e Mi formam o acorde de Lá menor.', passos:[{mao:'left', dir:'open', midi:57}, {mao:'left', dir:'open', midi:60}, {mao:'left', dir:'open', midi:64}]},
  9: {intro:'Melodia na direita, baixo na esquerda, o mesmo fole.', passos:[{mao:'left', dir:'open', midi:48}, {mao:'right', dir:'open', midi:60}]},
};
state.progress.tarefas = state.progress.tarefas || {};
let tarefa = null, tarefaKbs = [];
const textoPasso = p => p.midi==null ? `Toque qualquer botão da ${p.mao==='left'?'mão esquerda':'mão direita'}`
  : `Toque ${noteName(p.midi)} ${p.dir==='open'?'abrindo':'fechando'} na ${p.mao==='left'?'mão esquerda':'mão direita'}`;
function montarTarefa(i){
  tarefaKbs.forEach(k=>{ const x=allKeyboards.indexOf(k); if(x>=0) allKeyboards.splice(x,1); }); tarefaKbs = [];
  const T = TAREFAS_LICAO[i], host = $('#lessonTarefa'); if(!T || !host) { tarefa = null; return; }
  tarefa = {i, passo:0, erros:0};
  host.innerHTML = `<div class="tarefa-topo"><span class="tarefa-ic"><svg aria-hidden="true"><use href="#i-keys"/></svg></span>
    <div><b>Experimente agora</b><div class="muted">${T.intro}</div></div></div>
    <ol class="tarefa-passos">${T.passos.map(p=>`<li>${textoPasso(p)}</li>`).join('')}</ol>
    <div class="tarefa-fb feedback" aria-live="polite"></div>
    <div class="tarefa-kb" data-mao="left"></div><div class="tarefa-kb" data-mao="right"></div>`;
  for(const lado of ['left','right']) tarefaKbs.push(kb(host.querySelector(`.tarefa-kb[data-mao="${lado}"]`), lado, {perRow:1,
    getDir:()=>tarefa && T.passos[Math.min(tarefa.passo, T.passos.length-1)].dir, onPress:(b,m,dir,k)=>tarefaToque(b,m,k)}));
  tarefaPasso();
}
function tarefaPasso(){
  const T = TAREFAS_LICAO[tarefa.i], host = $('#lessonTarefa'), feita = tarefa.passo>=T.passos.length;
  host.querySelectorAll('.tarefa-passos li').forEach((li,k)=>{ li.classList.toggle('feito', k<tarefa.passo); li.classList.toggle('atual', k===tarefa.passo); });
  host.classList.toggle('feita', feita);
  if(feita){ host.querySelectorAll('.tarefa-kb').forEach(el=>el.hidden=true); return; }
  const p = T.passos[tarefa.passo];
  host.querySelectorAll('.tarefa-kb').forEach(el=>el.hidden = el.dataset.mao!==p.mao);
  tarefaKbs.forEach(k=>{ k.refresh(); k.clearMarks(); });
  tarefa.erros = 0;
}
function tarefaToque(b, m, k){
  if(!tarefa) return;
  const T = TAREFAS_LICAO[tarefa.i], p = T.passos[tarefa.passo], fb = $('#lessonTarefa .tarefa-fb'); if(!p) return;
  if(p.midi==null || m===p.midi){
    k.mark(b.id,'ok'); tarefa.passo++;
    fb.className = 'tarefa-fb feedback ok'; fb.textContent = tarefa.passo>=T.passos.length ? 'Tarefa feita! Agora responda as perguntas.' : `Certo! ${noteName(m)}`;
    if(tarefa.passo>=T.passos.length && !state.progress.tarefas[tarefa.i]){ state.progress.tarefas[tarefa.i] = true; saveProgress(); }
    setTimeout(()=>{ if(tarefa) tarefaPasso(); }, 450);
  } else {
    k.mark(b.id,'bad'); tarefa.erros++;
    fb.className = 'tarefa-fb feedback bad'; fb.textContent = `Esse é ${noteName(m)}. Tente de novo.`;
    if(tarefa.erros>=2){ const alvo = state.layout[p.mao].find(x=>x[p.dir]===p.midi); if(alvo) k.mark(alvo.id,'hint',0); }
  }
}
let curLesson=0, lessonAnswered={}, lessonKb=null, lessonCount={open:0,close:0}, lessonDir='open';
const lessonTr = i => (LICOES_TRAD[state.lang] && LICOES_TRAD[state.lang][i]) || LESSONS[i];
function renderLessonList(){
  $('#lessonList').innerHTML='<h3 style="margin-top:0">Lições</h3>'+LESSONS.map((l,i)=>
    `<button data-i="${i}" class="${i===curLesson?'active':''}">${lessonTr(i).title}${state.progress.lessons[i]?'<span class="done">✓</span>':''}</button>`).join('');
}
$('#lessonList').addEventListener('click',e=>{ const b=e.target.closest('button'); if(b){ curLesson=+b.dataset.i; renderLesson(); } });
function renderLesson(){
  renderLessonList();
  const L=LESSONS[curLesson], T=lessonTr(curLesson); lessonAnswered={}; const answered=lessonAnswered;
  $('#lessonBody').innerHTML=`<h2>${T.title}</h2>${T.html}${TAREFAS_LICAO[curLesson]?'<div class="tarefa" id="lessonTarefa"></div>':''}<h3>Verifique o que aprendeu</h3>`+
    T.quiz.map((q,qi)=>`<div class="q" data-q="${qi}"><div>${q.q}</div><div class="opts">${q.o.map((o,oi)=>`<button class="btn sec" data-o="${oi}">${o}</button>`).join('')}</div><div class="fb muted"></div></div>`).join('')+
    `<div class="row" style="margin-top:12px"><button class="btn sec" id="prevL" ${curLesson===0?'disabled':''}>← Anterior</button><button class="btn" id="nextL" ${curLesson===LESSONS.length-1?'disabled':''}>Próxima →</button></div>`;
  $$('#lessonBody .q').forEach(qe=>qe.addEventListener('click',e=>{
    const o=e.target.dataset.o; if(o==null) return;
    const qi=+qe.dataset.q, q=L.quiz[qi], btn=e.target;
    vibrar(+o===q.a?'ok':'erro');
    if(+o===q.a){ btn.classList.add('right'); qe.querySelector('.fb').textContent='Correto!'; answered[qi]=true; }
    else { btn.classList.add('wrong'); qe.querySelector('.fb').textContent='Ainda não, tente outra opção.'; }
    tryCompleteLesson();
  }));
  $('#prevL').onclick=()=>{ curLesson--; renderLesson(); };
  $('#nextL').onclick=()=>{ curLesson++; renderLesson(); };
  montarTarefa(curLesson);
  const host=$('#lessonKbd');
  if(host){
    lessonCount={open:0,close:0}; lessonDir='open';
    host.innerHTML=`<div class="row" style="margin:8px 0"><button class="btn" id="lDir">Direção: Abrindo (trocar)</button><span id="lCount" class="muted"></span></div><div id="lKb"></div>`;
    // recria o teclado do exercício e tira o antigo da lista global
    const idx=allKeyboards.indexOf(lessonKb); if(idx>=0) allKeyboards.splice(idx,1);
    lessonKb=kb($('#lKb'),'right',{perRow:1, getDir:()=>lessonDir, onPress:(b,m,dir)=>{ lessonCount[dir]++; updLessonCount(noteName(m)); tryCompleteLesson(); }});
    $('#lDir').onclick=()=>{ lessonDir=lessonDir==='open'?'close':'open'; $('#lDir').textContent=`Direção: ${dirLabel(lessonDir)} (trocar)`; lessonKb.refresh(); };
    updLessonCount();
  }
}
// A lição é concluída quando todas as perguntas foram acertadas (e, na lição 3, o exercício feito)
function tryCompleteLesson(){
  const L=LESSONS[curLesson];
  if(L.quiz.every((_,i)=>lessonAnswered[i]) && !state.progress.lessons[curLesson] && (!lessonNeedsExercise() || lessonExerciseDone())){
    state.progress.lessons[curLesson]=true; saveProgress(); renderLessonList(); logPractice('licao');
  }
}
const lessonNeedsExercise=()=>!!LESSONS[curLesson].html.includes('lessonKbd');
const lessonExerciseDone=()=>lessonCount.open>=3 && lessonCount.close>=3;
function updLessonCount(last){
  const done=lessonExerciseDone();
  $('#lCount').innerHTML=`Abrindo: ${Math.min(3,lessonCount.open)}/3 · Fechando: ${Math.min(3,lessonCount.close)}/3 ${last?'· última: <b>'+last+'</b>':''} ${done?'✓ Exercício feito, agora responda a pergunta.':''}`;
}
