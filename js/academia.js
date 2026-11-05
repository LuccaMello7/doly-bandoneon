/* ================== Academia de Bandoneón ================== */
// Exercícios em 6 níveis, com instrutor digital, Guia de Dedilhado e três modos:
//   Aprender  mostra o próximo botão, o dedo e o fole; só avança com a nota certa
//   Praticar  mostra a sequência e deixa tocar no próprio ritmo, apontando os erros
//   Desafio   no tempo, com metrônomo, tirando os auxílios aos poucos conforme a precisão
//
// Cada exercício vira uma lista de EVENTOS musicais:
//   {k, id, exercicio, botao (botão do mapa), mao, midi, fole, dedo, alternativas, inicio, duracao, grupo}
// inicio e duracao em tempos. dedo é o dedo recomendado (1 a 5) ou null quando ainda não foi
// definido; alternativas são outros dedos aceitos pelo método. O dedo vem da partitura do
// exercício (formato de texto "Dó4:4@2" ou "Dó4:4@2,3"), nunca de uma regra fixa por botão:
// a digitação muda conforme a frase. Botão e fole vêm do mapa configurado (state.layout).
//
// O que o app consegue conferir (VALIDACAO):
//   tela ou mouse:  nota, botão, mão, direção do fole virtual e ritmo
//   microfone:      nota e ritmo (o mesmo som pode sair de botões e direções diferentes)
//   dedo:           nenhuma entrada atual identifica o dedo físico. O dedo é só SUGERIDO, a não ser
//                   que um validador seja registrado com registrarValidadorDeDedos() (ex.: câmera).

/* ---------- Validação ---------- */
let validadorDeDedos = null;
// v.dedoUsado(evento, toque) devolve o dedo (1 a 5) que o validador viu, ou null se não souber
function registrarValidadorDeDedos(v){ validadorDeDedos = v; acadValidacaoTexto(); }

/* ---------- Exercícios ---------- */
const DO_MAIOR = [0,2,4,5,7,9,11];
// Notas de Dó maior entre de e ate que existem na mão e na direção pedidas (pelo mapa configurado)
function acadEscalaNaDirecao(hand, dir, de, ate){
  const tem = new Set(state.layout[hand].map(b=>b[dir]));
  const todas = []; for(let m=de; m<=ate; m++) if(DO_MAIOR.includes(m%12)) todas.push(m);
  // maior trecho de graus seguidos que existe nessa direção
  let melhor = [], atual = [];
  for(const m of todas){ if(tem.has(m)){ atual.push(m); if(atual.length>melhor.length) melhor=atual.slice(); } else atual = []; }
  return melhor;
}
// Monta uma melodia a partir de notas {midi, beats, hand, force}
function acadDeNotas(lista, bpm){
  let t = 0; const notes = lista.map(n=>{ const x = {beats:1, ...n, t}; t += x.beats; return x; });
  return {bpm, hand: lista[0] ? lista[0].hand : 'right', notes};
}
// Nível 1: botões sorteados do mapa (sorteio inteligente: os que você mais erra aparecem mais)
function acadSorteio(hands, dirs, n){
  const notes = []; let ultimo = null;
  for(let i=0; i<n; i++){
    const hand = pick(hands), dir = pick(dirs), L = state.layout[hand];
    const w = L.map(b=>findWeight(hand,b,dir) * (b===ultimo?0.05:1));
    let r = Math.random()*w.reduce((a,b)=>a+b,0), b = L[L.length-1];
    for(let j=0;j<L.length;j++){ r-=w[j]; if(r<=0){ b=L[j]; break; } }
    ultimo = b; notes.push({midi:b[dir], beats:1, hand, t:i, dir, btn:b});
  }
  return {bpm:60, notes, pronto:true};
}
// Mesmo botão abrindo e fechando: duas notas por botão
function acadParesDeDirecao(n){
  const notes = [], L = state.layout.right, usados = new Set();
  while(notes.length < 2*n && usados.size < L.length){
    const b = pick(L); if(usados.has(b)) continue; usados.add(b);
    notes.push({midi:b.open, beats:1, hand:'right', t:notes.length, dir:'open', btn:b});
    notes.push({midi:b.close, beats:1, hand:'right', t:notes.length, dir:'close', btn:b});
  }
  return {bpm:60, notes, pronto:true};
}
const melodiaPronta = id => BUILTIN_MELODIES.find(m=>m.id===id).text;
// Nível 7: partituras importadas pelo usuário (js/partituras.js), guardadas neste navegador
const minhasPartituras = () => store.get('acadPartituras', []);
const escHtml = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML.replace(/\x22/g, '&quot;'); };

const ACADEMIA = [
{nivel:1, titulo:'Reconhecimento dos botões', objetivo:'Aprender onde fica cada nota, nas duas mãos e nas duas direções do fole.', exercicios:[
  {id:'n1-direita', titulo:'Notas da mão direita', desc:'Encontre 10 notas sorteadas na mão direita.', gerar:()=>acadSorteio(['right'],['open','close'],10), semTempo:true, nomes:false},
  {id:'n1-esquerda', titulo:'Notas da mão esquerda', desc:'Encontre 10 notas sorteadas na mão esquerda.', gerar:()=>acadSorteio(['left'],['open','close'],10), semTempo:true, nomes:false},
  {id:'n1-direcao', titulo:'Abrindo e fechando', desc:'Cada botão dá duas notas. Toque o mesmo botão abrindo e depois fechando: troque o fole (Espaço) entre as duas.', gerar:()=>acadParesDeDirecao(5), semTempo:true, nomes:false, foleManual:true},
  {id:'n1-sem-ajuda', titulo:'Sem auxílio visual', desc:'Etapa avançada: encontre as notas sem destaque e sem nomes nos botões.', gerar:()=>acadSorteio(['left','right'],['open','close'],10), semTempo:true, nomes:false, semAjuda:true},
]},
{nivel:2, titulo:'Reconhecimento dos dedos', objetivo:'Associar cada botão ao dedo recomendado. Os botões são tocados pelos dedos 2 a 5; os polegares cuidam da válvula de ar (direito) e do apoio (esquerdo).', exercicios:[
  {id:'n2-indicado', titulo:'Botão e dedo indicados', desc:'Toque cada botão destacado, olhando o dedo indicado no instrutor.', texto:'direita: Dó4:2 Mi4:2 | Sol4:2 Mi4:2 | Ré4:2 Fá4:2 | Mi4:1', bpm:60},
  {id:'n2-sequencias', titulo:'Sequências simples', desc:'Pequenas sequências de botões vizinhos, devagar.', texto:'direita: Dó4 Ré4 Mi4 Ré4 | Dó4:2 p:2 | Mi4 Fá4 Sol4 Fá4 | Mi4:2 p:2', bpm:60},
  {id:'n2-indicador-medio', titulo:'Alternar indicador e médio', desc:'Alternância entre os dedos 2 e 3.', pendente:true},
  {id:'n2-anelar-minimo', titulo:'Anelar e mínimo', desc:'Movimentos com os dedos 4 e 5, os mais fracos.', pendente:true},
  {id:'n2-memorizar', titulo:'Memorize a sequência', desc:'Ouça e veja a sequência (🔊 Ouvir). Ao começar, ela some: toque de memória.', texto:'direita: Mi4 Ré4 Dó4 Ré4 | Mi4 Mi4 Mi4:2', bpm:60, memorizar:true},
]},
{nivel:3, titulo:'Independência dos dedos', objetivo:'Desenvolver coordenação e precisão. No modo Desafio a velocidade sobe conforme a sua precisão.', exercicios:[
  {id:'n3-escada', titulo:'Sobe e desce', desc:'Sequência ascendente e descendente.', texto:'direita: Dó4:8 Ré4:8 Mi4:8 Fá4:8 Sol4:8 Fá4:8 Mi4:8 Ré4:8 | Dó4:2', bpm:70},
  {id:'n3-alternancia', titulo:'Alternância', desc:'Notas alternadas em terças: uma volta, duas para frente.', texto:'direita: Dó4:8 Mi4:8 Ré4:8 Fá4:8 Mi4:8 Sol4:8 Fá4:8 Lá4:8 | Sol4:2', bpm:70},
  {id:'n3-repeticao', titulo:'Repetição controlada', desc:'Repita a mesma nota com regularidade, sem acelerar.', texto:'direita: Dó4:8 Dó4:8 Dó4:8 Dó4:8 Ré4:8 Ré4:8 Ré4:8 Ré4:8 | Mi4:8 Mi4:8 Mi4:8 Mi4:8 Ré4:2', bpm:70},
  {id:'n3-tres', titulo:'Padrões de três notas', desc:'O mesmo desenho de três notas, subindo um grau por vez.', texto:'direita: Dó4:8 Ré4:8 Mi4:4 Ré4:8 Mi4:8 Fá4:4 | Mi4:8 Fá4:8 Sol4:4 Fá4:8 Sol4:8 Lá4:4 | Sol4:2', bpm:70},
  {id:'n3-quatro', titulo:'Padrões de quatro notas', desc:'Desenho de quatro notas, subindo um grau por vez.', texto:'direita: Dó4:8 Ré4:8 Mi4:8 Fá4:8 Ré4:8 Mi4:8 Fá4:8 Sol4:8 | Mi4:8 Fá4:8 Sol4:8 Lá4:8 Sol4:2', bpm:70},
  {id:'n3-legato', titulo:'Legato', desc:'Ligado: segure cada botão até apertar o próximo, sem silêncio entre as notas.', texto:'direita: Dó4:4 Ré4:4 Mi4:4 Fá4:4 | Sol4:2 Mi4:2 | Dó4:1', bpm:66, articulacao:'legato'},
  {id:'n3-staccato', titulo:'Staccato', desc:'Picado: solte o botão rápido, deixando um silêncio entre as notas.', texto:'direita: Dó4:4 Ré4:4 Mi4:4 Fá4:4 | Sol4:4 Mi4:4 Dó4:2', bpm:66, articulacao:'staccato'},
]},
{nivel:4, titulo:'Coordenação com o fole', objetivo:'Integrar a digitação com a direção do fole. Aqui o fole é seu: troque com Espaço ou com o botão de fole.', exercicios:[
  {id:'n4-abrindo', titulo:'Só abrindo', desc:'Uma escada de notas que existem com o fole abrindo.', gerar:()=>{ const s=acadEscalaNaDirecao('right','open',60,72).slice(0,5); return acadDeNotas([...s, ...s.slice(0,-1).reverse()].map(m=>({midi:m, hand:'right', force:'open'})), 66); }, foleManual:true},
  {id:'n4-fechando', titulo:'Só fechando', desc:'Uma escada de notas que existem com o fole fechando.', gerar:()=>{ const s=acadEscalaNaDirecao('right','close',60,72).slice(0,5); return acadDeNotas([...s, ...s.slice(0,-1).reverse()].map(m=>({midi:m, hand:'right', force:'close'})), 66); }, foleManual:true},
  {id:'n4-alternar', titulo:'Alternar a direção', desc:'A mesma nota abrindo e depois fechando (em botões diferentes). Troque o fole a cada nota.', gerar:()=>{
    const tem = d => new Set(state.layout.right.map(b=>b[d])), a=tem('open'), f=tem('close');
    const ns = []; for(let m=60; m<=72 && ns.length<8; m++) if(DO_MAIOR.includes(m%12) && a.has(m) && f.has(m)) ns.push({midi:m, hand:'right', force:'open'}, {midi:m, hand:'right', force:'close'});
    return acadDeNotas(ns, 60); }, foleManual:true},
  {id:'n4-frases', titulo:'Pequenas frases', desc:'Uma frase curta com trocas de fole nos lugares sugeridos.', texto:'direita: Dó4 Dó4 Sol4 Sol4 | Lá4 Lá4 Sol4:2 | Fá4 Fá4 Mi4 Mi4 | Ré4 Ré4 Dó4:2', bpm:80, foleManual:true},
  {id:'n4-sem-interromper', titulo:'Trocar sem interromper', desc:'Escala ligada: troque o fole sem deixar um buraco de silêncio na frase (avaliado no modo Desafio).', texto:melodiaPronta('esc-do'), bpm:72, foleManual:true, verificaTroca:true, articulacao:'legato'},
]},
{nivel:5, titulo:'Coordenação das duas mãos', objetivo:'Independência entre a mão direita e a esquerda, com um fole só para as duas.', exercicios:[
  {id:'n5-alternadas', titulo:'Mãos alternadas', desc:'Uma nota na direita, outra na esquerda.', texto:'direita: Dó4:4 p:4 Mi4:4 p:4 | Sol4:4 p:4 Mi4:4 p:4\nesquerda: p:4 Dó3:4 p:4 Sol2:4 | p:4 Dó3:4 p:4 Sol2:4', bpm:66, foleManual:true},
  {id:'n5-acompanhamento', titulo:'Acompanhamento na esquerda', desc:'A direita segura notas longas enquanto a esquerda marca os baixos.', texto:'direita: Mi4:2 Ré4:2 | Dó4:1\nesquerda: Dó3 Sol2 Dó3 Sol2 | Dó3 Sol2 Dó3 Sol2', bpm:66, foleManual:true},
  {id:'n5-ritmo', titulo:'Padrão rítmico', desc:'Marcato na esquerda (quatro por compasso) e notas longas na direita.', texto:'direita: Mi4:2 Sol4:2 | Fá4:2 Ré4:2\nesquerda: Dó3:4 Dó3:4 Dó3:4 Dó3:4 | Sol2:4 Sol2:4 Sol2:4 Sol2:4', bpm:72, foleManual:true},
  {id:'n5-frases', titulo:'Frase com as duas mãos', desc:'O começo da Ode à Alegria com baixos.', texto:'direita: Mi4 Mi4 Fá4 Sol4 | Sol4 Fá4 Mi4 Ré4 | Dó4 Dó4 Ré4 Mi4 | Mi4:4. Ré4:8 Ré4:2\nesquerda: Dó3:2 Dó3:2 | Sol2:2 Sol2:2 | Dó3:2 Dó3:2 | Sol2:2 Sol2:2', bpm:72, foleManual:true},
  {id:'n5-sincronia', titulo:'Sincronia', desc:'As duas mãos juntas. No modo Desafio o app mede a diferença de entrada entre elas.', texto:'direita: Dó4:2 Mi4:2 | Sol4:2 Mi4:2 | Dó4:1\nesquerda: Dó3:2 Dó3:2 | Sol2:2 Sol2:2 | Dó3:1', bpm:66, foleManual:true, verificaSincronia:true},
]},
{nivel:6, titulo:'Aplicação musical', objetivo:'Aplicar a técnica em músicas: devagar, com metrônomo, repetindo trechos e por fim sem auxílio visual.', exercicios:[
  {id:'n6-estrelinha', titulo:'Brilha, brilha estrelinha', desc:'Melodia simples com digitação guiada.', texto:melodiaPronta('estrelinha'), foleManual:true},
  {id:'n6-ode', titulo:'Ode à Alegria', desc:'Um pouco mais longa, com ritmo pontuado.', texto:melodiaPronta('ode'), foleManual:true},
  {id:'n6-lam', titulo:'Lá menor harmônica', desc:'A escala com a cor do tango, com trocas de fole.', texto:melodiaPronta('esc-lam'), foleManual:true},
  {id:'n6-choclo', titulo:'El Choclo: introdução', desc:'O primeiro tango: oito compassos em colcheias, com o cromatismo do Lá#.', texto:melodiaPronta('choclo-intro'), foleManual:true},
  {id:'n6-ode-duas', titulo:'Ode à Alegria a duas mãos', desc:'Melodia e baixos juntos: o desafio final.', texto:melodiaPronta('ode-duas'), foleManual:true},
]},
{nivel:7, titulo:'Minhas partituras', objetivo:'Importe uma partitura (MusicXML ou MIDI): o app transcreve cada nota para um botão, com a mão, a direção do fole, a duração e as pausas. Depois é só treinar nos modos Aprender, Praticar e Desafio.',
  get exercicios(){ return minhasPartituras().map(p=>({id:p.id, titulo:p.titulo, desc:p.desc, texto:p.texto, minha:true})); }},
];
const todosExercicios = () => ACADEMIA.flatMap(n=>n.exercicios.map(e=>({...e, nivel:n.nivel})));
const exercicioPorId = id => todosExercicios().find(e=>e.id===id);

/* ---------- Estado ---------- */
state.progress.academia = state.progress.academia || {};
const acad = {nivel: store.get('acadNivel', 1), ex:null, modo:'aprender', eventos:[], grupos:[], g:-1, pend:new Set(),
  rodando:false, demo:false, timers:[], raf:null, bus:null, dir:'open', res:[], inicioMs:0, bpm:80, spb:1,
  porBotao:{}, foraDoTempo:0, erros:0, pendErros:{}};
const progEx = id => state.progress.academia[id] = state.progress.academia[id] || {melhor:{}, vel:null, ajuda:2, vezes:0};

const acOpts = {getDir:()=>acad.dir, showLabels:()=>acadMostraNomes(), onPress:(b,m,dir,k)=>acadToque(b,m,dir,k),
                onRelease:b=>acadSoltou(b), perRow:1, largura:()=>acadLarguraTeclado()};
function acadLarguraTeclado(){
  const c=$('#acCentro'); if(!c || !c.clientWidth) return 0;
  return acadLadoALado() ? (c.clientWidth - 40 - 70)/2 : Math.min(620, c.clientWidth - 30);
}
const acadLadoALado = () => { const c=$('#acCentro'); return $('#acTeclados').dataset.maos==='duas' && c && c.clientWidth>=760; };
const akL = kb($('#acKbLeft'),'left',acOpts), akR = kb($('#acKbRight'),'right',acOpts);
const akOf = hand => hand==='left' ? akL : akR;
const acadVel = () => +$('#acVel').value/100;
const acadFoleAuto = () => $('#acAuto').checked;
const acadGuia = () => $('#acGuia').checked;
const maoNome = h => t(h==='left' ? 'mão esquerda' : 'mão direita');
const nomeEvento = e => `${noteName(e.midi)} ${dirLabel(e.fole).toLowerCase()}`;

// O que cada modo mostra. Desafio tira os auxílios aos poucos (ajuda 2 → 1 → 0).
function acadAjuda(){
  const g = acadGuia(), ex = acad.ex || {};
  if(ex.semAjuda) return {brilho:false, dedo:false, maos:false, fole:false, faixa:'oculta'};
  if(ex.memorizar && acad.rodando) return {brilho:false, dedo:g, maos:g, fole:false, faixa:'oculta'};
  if(acad.demo || acad.modo==='aprender') return {brilho:g, dedo:g, maos:g, fole:true, faixa:'completa'};
  if(acad.modo==='praticar') return {brilho:false, dedo:g, maos:g, fole:true, faixa:'completa'};
  const nivel = progEx(ex.id).ajuda;
  if(nivel>=2) return {brilho:g, dedo:g, maos:g, fole:true, faixa:'completa'};
  if(nivel===1) return {brilho:false, dedo:g, maos:g, fole:true, faixa:'completa'};
  return {brilho:false, dedo:false, maos:false, fole:false, faixa:'nomes'};
}
function acadMostraNomes(){ return $('#acNomes').checked && !(acad.ex && acad.ex.semAjuda); }

/* ---------- Níveis e exercícios na tela ---------- */
function acadFuncionais(n){ return n.exercicios.filter(e=>!e.pendente); }
function acadConcluido(id){ const p = state.progress.academia[id]; return !!p && Math.max(p.melhor.praticar||0, p.melhor.desafio||0) >= 80; }
function renderAcadNiveis(){
  $('#acNiveis').innerHTML = ACADEMIA.map(n=>{
    const f = acadFuncionais(n), feitos = f.filter(e=>acadConcluido(e.id)).length;
    const p = f.length ? feitos/f.length : 0;
    return `<button type="button" class="ac-nivel${n.nivel===acad.nivel?' on':''}${p===1?' completo':''}" data-nivel="${n.nivel}" style="--p:${p}">`
      + `<span class="ac-num"><b>${n.nivel}</b></span><span class="ac-ntit">${n.titulo}</span>`
      + `<span class="muted ac-nfeitos">${t('{}/{} concluídos', feitos, f.length)}</span></button>`;
  }).join('');
}
function renderAcadLista(){
  const n = ACADEMIA.find(x=>x.nivel===acad.nivel);
  $('#acNivelTitulo').textContent = t('Nível {}: {}', n.nivel, t(n.titulo));
  $('#acNivelObjetivo').textContent = n.objetivo;
  $('#acPartituras').hidden = n.nivel!==7;
  if(n.nivel===7 && !n.exercicios.length){ $('#acLista').innerHTML = `<p class="muted">${t('Nenhuma partitura ainda. Importe a primeira acima.')}</p>`; return; }
  $('#acLista').innerHTML = n.exercicios.map(e=>{
    const p = state.progress.academia[e.id], melhor = p ? Math.max(p.melhor.aprender||0, p.melhor.praticar||0, p.melhor.desafio||0) : null;
    const st = e.pendente ? `<span class="ac-pend">${'Aguardando o dedilhado de referência'}</span>`
      : acadConcluido(e.id) ? `<span class="ac-ok">✓ ${melhor}%</span>` : melhor!=null ? `<span class="muted">${melhor}%</span>` : '';
    const tit = e.minha ? escHtml(e.titulo) : e.titulo, desc = e.minha ? escHtml(e.desc) : e.desc;
    const botao = `<button type="button" class="ac-ex${acad.ex&&acad.ex.id===e.id?' on':''}" data-ex="${e.id}"${e.pendente?' disabled':''}>`
      + `<b>${tit}</b><span class="muted">${desc}</span>${st}</button>`;
    // partituras do usuário: botão para remover
    return e.minha ? `<div class="ac-ex-minha">${botao}<button type="button" class="ac-del" data-del="${e.id}" title="${t('Remover')}" aria-label="${t('Remover')}">✕</button></div>` : botao;
  }).join('');
}
$('#acNiveis').addEventListener('click', ev=>{
  const b = ev.target.closest('[data-nivel]'); if(!b) return;
  acad.nivel = +b.dataset.nivel; store.set('acadNivel', acad.nivel);
  renderAcadNiveis(); renderAcadLista();
  const n = ACADEMIA.find(x=>x.nivel===acad.nivel), f = acadFuncionais(n);
  if(f.length) carregarExercicio((f.find(e=>!acadConcluido(e.id)) || f[0]).id);
});
$('#acLista').addEventListener('click', ev=>{
  const d = ev.target.closest('[data-del]');
  if(d){ removerPartitura(d.dataset.del); return; }
  const b = ev.target.closest('[data-ex]'); if(b && !b.disabled) carregarExercicio(b.dataset.ex);
});

/* ---------- Carregar um exercício ---------- */
function montarEventos(ex){
  let m;
  if(ex.gerar){ m = ex.gerar(); if(!m.pronto){ buildTimeline(m); fingerMelody(m); } }
  else { m = parseMelody(ex.texto); if(ex.bpm) m.bpm = ex.bpm; buildTimeline(m); fingerMelody(m); }
  const notas = m.notes.filter(n=>!n.rest && !n.error && n.btn);
  acad.bpm = m.bpm;
  // a digitação definida pelo professor (js/professor.js) vale mais que a da partitura
  const dg = typeof digitacaoDe==='function' && !ex.gerar ? digitacaoDe(ex.id) : null;
  return notas.map((n,k)=>{ const id = `${ex.id}#${k+1}`, prof = dg && dg[id]!=null;
    return {k, id, exercicio:ex.id, botao:n.btn, mao:n.hand, midi:n.midi, fole:n.dir,
      dedo: prof ? dg[id] : n.dedo ?? null, fonte: prof ? 'professor' : null, alternativas:n.alt || [], inicio:n.t, duracao:n.beats}; });
}
function agruparEventos(evs){
  const gs = [];
  evs.forEach(e=>{ const g = gs[gs.length-1];
    if(g && Math.abs(g.inicio-e.inicio)<1e-6) g.ks.push(e.k); else gs.push({inicio:e.inicio, ks:[e.k], fole:e.fole});
    e.grupo = gs.length-1; });
  return gs;
}
function carregarExercicio(id){
  acadParar();
  const ex = exercicioPorId(id); if(!ex) return;
  acad.ex = ex; acad.nivel = ex.nivel; store.set('acadEx', id); store.set('acadNivel', ex.nivel);
  acad.todos = montarEventos(ex);
  const p = progEx(ex.id);
  $('#acVel').value = p.vel || (ex.nivel>=3 && ex.nivel<=5 ? 60 : 70); $('#acVelVal').textContent = $('#acVel').value+'%';
  $('#acAuto').checked = ex.minha || (!ex.foleManual && ex.nivel<4); // nas partituras importadas o fole começa automático
  $('#acNomes').checked = ex.nomes!==false;
  $('#acDe').value = 1; $('#acAte').value = acad.todos.length; $('#acDe').max = $('#acAte').max = acad.todos.length;
  $('#acTrecho').style.display = ex.semTempo ? 'none' : '';
  $('#acExTitulo').textContent = ex.titulo; $('#acExDesc').textContent = ex.desc;
  $('#acRelatorio').innerHTML = ''; acadFeed('');
  if(typeof acadTranscricao==='function') acadTranscricao(); // js/partituras.js (carregado depois)
  aplicarTrecho(); renderAcadNiveis(); renderAcadLista(); refreshAll(); acadValidacaoTexto();
}
// Usa só as notas do trecho escolhido (da nota "de" até "até"), com o tempo recomeçando do zero
function aplicarTrecho(){
  const N = acad.todos.length;
  let de = Math.max(1, Math.min(N, +$('#acDe').value||1)), ate = Math.max(de, Math.min(N, +$('#acAte').value||N));
  $('#acDe').value = de; $('#acAte').value = ate;
  const sel = acad.todos.slice(de-1, ate), t0 = sel.length ? sel[0].inicio : 0;
  acad.eventos = sel.map((e,k)=>({...e, k, inicio:e.inicio-t0}));
  acad.grupos = agruparEventos(acad.eventos);
  acad.g = -1; acad.pend = new Set();
  renderFaixa(); acadInstrutor(0); acadPrevia(); acadMaos(); acadResumo();
}
// Só a mão que o exercício usa; com as duas, lado a lado e com o fole no meio, como no instrumento
function acadMaos(){
  const usa = new Set(acad.eventos.map(e=>e.mao)), m = usa.size===1 ? [...usa][0] : 'duas';
  $('#acTeclados').dataset.maos = m;
  $('#acMaoE').hidden = m==='right'; $('#acMaoD').hidden = m==='left';
  if(typeof currentView!=='undefined' && currentView==='academia') acadMostrar(); // ler a largura com a aba fechada forçaria o layout da página
}
// Escolha recolhida enquanto você toca: uma linha com o nível e o exercício, e o botão de trocar
function acadResumo(){
  if(!acad.ex) return;
  $('#acResumoNum').textContent = acad.ex.nivel; $('#acResumoTit').textContent = t(acad.ex.titulo);
  const n = ACADEMIA.find(x=>x.nivel===acad.ex.nivel); $('#acResumoNivel').textContent = t('Nível {}: {}', n.nivel, t(n.titulo));
}
function acadRecolher(sim){ $('#acEscolha').classList.toggle('recolhido', sim); }
$('#acTrocar').onclick = ()=>{ acadParar(); acadPrevia(); acadRecolher(false); $('#acEscolha').scrollIntoView({behavior: movReduzido()?'auto':'smooth', block:'start'}); };
['#acDe','#acAte'].forEach(s=>$(s).addEventListener('change', ()=>{ acadParar(); aplicarTrecho(); }));
$('#acVel').oninput = e=>{ $('#acVelVal').textContent = e.target.value+'%'; };

/* ---------- Faixa de notas, instrutor e dicas no teclado ---------- */
function renderFaixa(){
  const aj = acadAjuda(), duas = acad.eventos.some(e=>e.mao==='left') && acad.eventos.some(e=>e.mao==='right');
  $('#acStrip').innerHTML = acad.grupos.map((g,i)=>{
    const evs = g.ks.map(k=>acad.eventos[k]);
    if(aj.faixa==='oculta') return `<div class="mcard" data-g="${i}">?<span class="d">&nbsp;</span></div>`;
    const nomes = evs.map(e=>(duas?`<small>${maoLetra(e.mao)}</small> `:'') + noteName(e.midi) + (aj.dedo && e.dedo!=null ? `<sup>${e.dedo}</sup>` : '')).join('<br>');
    const dir = aj.faixa==='completa' ? g.fole : '';
    return `<div class="mcard ${dir}" data-g="${i}">${nomes}<span class="d">${dir ? (dir==='open'?'A':'F') : '&nbsp;'}</span></div>`;
  }).join('');
}
function faixaMarca(i, cls){ const c = $(`#acStrip [data-g="${i}"]`); if(!c) return;
  if(cls==='cur'){ $$('#acStrip .mcard.cur').forEach(x=>x.classList.remove('cur')); c.classList.add('cur'); c.scrollIntoView({block:'nearest', inline:'center'}); }
  else { c.classList.remove('ok','bad'); c.classList.add(cls); } }
function textoDedo(e){
  if(e.dedo==null) return t('a definir (aguardando o dedilhado de referência)');
  const alt = e.alternativas.length ? ' ' + t('(também: {})', e.alternativas.join(', ')) : '';
  return `${e.dedo} · ${t(DEDOS[e.dedo])}${alt}${e.fonte==='professor' ? ' · ' + t('digitação do professor') : ''}`;
}
function acadInstrutor(gi){
  const aj = acadAjuda(), g = acad.grupos[gi], prox = acad.grupos[gi+1];
  if(!g){ $('#acAgora').innerHTML = `<div class="muted">${t('Escolha um exercício e um modo, depois aperte Começar.')}</div>`; $('#acProximo').textContent=''; maos.destacar({}); return; }
  const evs = g.ks.map(k=>acad.eventos[k]), oculto = aj.faixa==='oculta' && !(acad.ex.semAjuda);
  $('#acAgora').innerHTML = evs.map(e=>`<div class="ac-nota">${oculto ? '?' : noteName(e.midi)}</div>`
    + `<div class="ac-linha"><span class="muted">${t('Mão')}</span> <b>${t(e.mao==='left'?'Esquerda':'Direita')}</b></div>`
    + (aj.fole ? `<div class="ac-linha"><span class="muted">${t('Fole')}</span> <span class="dirpill ${e.fole}">${e.fole==='open'?'⟵ ':'⟶ '}${dirLabel(e.fole)}${e.fole==='open'?' ⟶':' ⟵'}</span></div>` : '')
    + (aj.dedo && e.dedo!=null ? `<div class="ac-linha"><span class="muted">${t('Dedo')}</span> <b>${textoDedo(e)}</b></div>` : '')
    + (acad.modo==='desafio' && !acad.ex.semTempo ? `<div class="ac-linha"><span class="muted">${t('Duração')}</span> ${t('{} tempo(s)', +e.duracao.toFixed(2))}</div>` : '')
  ).join('<hr>') + (oculto ? '' : renderDicas(gi));
  animarInstrutor(gi);
  const pe = prox ? prox.ks.map(k=>acad.eventos[k]) : [];
  $('#acProximo').textContent = !prox ? t('Próximo: fim do exercício') : oculto || aj.faixa==='nomes' ? t('Próximo: {}', pe.map(e=>noteName(e.midi)).join(' + '))
    : t('Próximo: {}', pe.map(e=>`${nomeEvento(e)} (${maoNome(e.mao)})${aj.dedo && e.dedo!=null ? ', ' + t('dedo {}', e.dedo) : ''}`).join(' + '));
  // mãos: dedo atual (aceso) e o da próxima nota (tracejado)
  $('#acMaos').style.display = aj.maos && $('#acMaosVer').checked ? '' : 'none';
  const info = {};
  for(const lado of ['left','right']){
    const a = evs.find(e=>e.mao===lado), p = pe.find(e=>e.mao===lado);
    info[lado] = {ativa:!!a, atual:a ? a.dedo : null, proximo:p ? p.dedo : null, proximaMao:!!p};
  }
  maos.destacar(info);
}
function acadDica(gi){
  akL.clearMarks(); akR.clearMarks(); akL.clearDedos(); akR.clearDedos();
  const g = acad.grupos[gi]; if(!g) return;
  const aj = acadAjuda(), prox = acad.grupos[gi+1];
  g.ks.map(k=>acad.eventos[k]).forEach(e=>{
    if(aj.brilho && acad.pend.has(e.k) || acad.demo) akOf(e.mao).mark(e.botao.id,'guia',0);
    if(aj.dedo && e.dedo!=null) akOf(e.mao).dedo(e.botao.id, e.dedo);
  });
  if(aj.brilho && prox) prox.ks.map(k=>acad.eventos[k]).forEach(e=>{ if(!g.ks.some(k=>acad.eventos[k].botao===e.botao)) akOf(e.mao).mark(e.botao.id,'prox',0); });
}
/* ---------- Dicas de posição (sem afirmar o dedo) ----------
   Sem um dedilhado de referência, o instrutor não indica dedo. Ele olha o mapa: a distância até o próximo
   botão da mesma mão, se o fole inverte, se a próxima nota é na outra mão e se as próximas notas ficam na
   mesma região. Uma unidade do mapa é mais ou menos a distância entre dois botões vizinhos. As direções
   (acima, à direita…) são as do teclado na tela. */
const distBotoes = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);
function rumo(a, b){
  const dx = b.x-a.x, dy = b.y-a.y, v = Math.abs(dy)<0.45 ? '' : dy>0 ? 'abaixo' : 'acima', h = Math.abs(dx)<0.45 ? '' : dx>0 ? 'à direita' : 'à esquerda';
  return [v, h].filter(Boolean).join(' e ');
}
function dicasPosicao(gi){
  const g = acad.grupos[gi], prox = acad.grupos[gi+1]; if(!g) return [];
  if(!prox) return [{tipo:'fim', txt:'Última nota do exercício.'}];
  const evs = g.ks.map(k=>acad.eventos[k]), pe = prox.ks.map(k=>acad.eventos[k]), dicas = [];
  if(prox.fole!==g.fole) dicas.push({tipo:'fole', txt: acadFoleAuto() ? 'Na próxima nota o fole inverte (o app troca sozinho).' : 'Na próxima nota o fole inverte: prepare a troca de direção.'});
  for(const e of evs){
    const n = pe.find(x=>x.mao===e.mao);
    if(!n){ if(pe.length && evs.length===1) dicas.push({tipo:'mao', txt:`A próxima nota é na ${pe[0].mao==='left'?'mão esquerda':'mão direita'}.`}); continue; }
    const d = distBotoes(e.botao, n.botao), r = rumo(e.botao, n.botao);
    if(n.botao===e.botao) dicas.push({tipo:'mesmo', txt: n.fole!==e.fole ? 'A próxima nota é no mesmo botão, com o fole ao contrário.' : 'A próxima nota repete o mesmo botão: solte e aperte de novo.'});
    else if(d<=1.35 && r) dicas.push({tipo:'perto', txt:`O próximo botão é vizinho (${r}): dá para alcançar sem mover a mão.`});
    else if(d<=3 && r) dicas.push({tipo:'medio', txt:`O próximo botão fica a ${Math.max(2, Math.round(d))} botões daqui (${r}): um pequeno deslocamento da mão.`});
    else if(r) dicas.push({tipo:'longe', txt:`O próximo botão está longe (${r}): prepare a mão com antecedência.`});
  }
  // as próximas notas da mesma mão ficam juntas? então a mão pode ficar parada
  const e0 = evs[0], seq = acad.eventos.filter(x=>x.k>=e0.k && x.mao===e0.mao).slice(0, 4);
  if(seq.length>=3 && seq.every(a=>seq.every(b=>distBotoes(a.botao, b.botao)<=2.2)) && new Set(seq.map(x=>x.botao)).size>1)
    dicas.push({tipo:'regiao', txt:`As próximas ${seq.length} notas ficam na mesma região: mantenha a mão no lugar.`});
  return dicas;
}
function renderDicas(gi){
  const ds = dicasPosicao(gi); if(!ds.length) return '';
  return `<ul class="ac-dicas">${ds.map(d=>`<li class="dica-${d.tipo}">${d.txt}</li>`).join('')}</ul>`;
}
// A nota nova entra animada e a barra mostra em que ponto do exercício você está
function animarInstrutor(gi){
  const n = acad.grupos.length, bar = $('#acProgBar');
  if(bar){ bar.style.width = (n ? 100*Math.max(0,gi)/n : 0) + '%'; $('#acProgTxt').textContent = n ? `Momento ${Math.min(n, Math.max(0,gi)+1)} de ${n}` : ''; }
  if(typeof currentView==='undefined' || currentView!=='academia') return; // com a aba fechada não há o que animar (e ler offsetWidth forçaria o layout)
  const el = $('#acAgora'); el.classList.remove('troca'); void el.offsetWidth; el.classList.add('troca');
}
function pulsoInstrutor(tipo){
  const el = $('#acInstrutor'); el.classList.remove('ok','erro'); void el.offsetWidth; el.classList.add(tipo);
}
// Prévia antes de começar: o primeiro botão já brilha, e tocá-lo começa o exercício
function acadPrevia(){
  acadDica(-1);
  const g = acad.grupos[0], aj = acadAjuda(); if(!g || acad.rodando || acad.demo) return;
  if(aj.brilho) g.ks.map(k=>acad.eventos[k]).forEach(e=>akOf(e.mao).mark(e.botao.id,'guia',0));
  acadFeed(acad.modo==='desafio' && !acad.ex.semTempo ? t('Aperte Começar: há uma contagem de 4 tempos antes das notas.')
    : aj.brilho ? t('Toque o botão que brilha para começar.') : t('Toque a primeira nota para começar, ou aperte Começar.'));
}
function acadComecarPorToque(){
  if(acad.modo==='desafio' && !acad.ex.semTempo) return false; // no tempo, a contagem precisa vir antes
  acad.autoInicio = true; $('#acStart').click(); acad.autoInicio = false;
  return acad.rodando;
}
function acadValidacaoTexto(){
  const el = $('#acValidacao'); if(!el) return;
  const temDedo = acad.eventos.some(e=>e.dedo!=null);
  const dedo = validadorDeDedos ? t('Dedo: verificado pelo validador de dedos.')
    : temDedo ? t('Dedo: apenas sugerido. O app não identifica qual dedo você usa.') : t('Dedo: o app não indica nem confere o dedo. As dicas seguem a posição dos botões no teclado da tela.');
  const fonte = mic.on ? t('Microfone: o app confere a nota e o ritmo; botão e fole não são verificados.')
    : t('Tela: o app confere a nota, o botão, a mão, o fole virtual e o ritmo.');
  el.textContent = fonte + ' ' + dedo;
}
function acadFeed(msg, cls=''){ const f=$('#acFeed'); f.className='feedback '+cls; f.textContent=msg; }

/* ---------- Fole ---------- */
function acadSetDir(d){
  acad.dir = d;
  const fm = $('#acFoleMini'); if(fm) fm.className = 'ac-fole-mini ' + d;
  const p = $('#acDirPill'); p.className = 'dirpill '+d; p.textContent = d==='open' ? t('⟵ ABRINDO ⟶') : t('⟶ FECHANDO ⟵');
  akL.refresh(); akR.refresh(); akL.retune(); akR.retune();
}
$('#acDirBtn').onclick = ()=>acadSetDir(acad.dir==='open'?'close':'open');

/* ---------- Avaliação de um toque ---------- */
// toque = {botao, mao, midi, fole, fonte:'tela'|'microfone'}. Separa nota, botão, mão, fole e dedo.
function avaliar(e, toque){
  if(toque.fonte==='microfone'){
    const nota = micMatches(toque.midi, e.midi);
    return {mao:true, nota, botao:'nao_verificado', fole:'nao_verificado', certo:nota, dedo:avaliarDedo(e, toque)};
  }
  const mao = toque.mao===e.mao, nota = mao && toque.midi===e.midi;
  const botao = mao && toque.botao.id===e.botao.id ? 'ok' : nota ? 'alternativo' : 'errado';
  const fole = acadFoleAuto() ? 'auto' : toque.fole===e.fole ? 'ok' : 'errado';
  return {mao, nota, botao, fole, certo: nota && fole!=='errado', dedo:avaliarDedo(e, toque)};
}
function avaliarDedo(e, toque){
  const visto = validadorDeDedos ? validadorDeDedos.dedoUsado(e, toque) : null;
  if(visto!=null && e.dedo!=null) return visto===e.dedo || e.alternativas.includes(visto) ? 'verificado' : 'incorreto';
  return e.dedo!=null ? 'sugerido' : 'a_definir';
}
// Descreve a diferença entre o pedido e o tocado
function diferenca(e, a, toque){
  if(toque.fonte==='microfone') return t('o microfone ouviu {}', noteName(toque.midi));
  if(!a.mao) return t('você tocou {} na {}: a nota é na {}', noteName(toque.midi), maoNome(toque.mao), maoNome(e.mao));
  const tocado = `${noteName(toque.midi)} ${dirLabel(toque.fole).toLowerCase()}`;
  if(a.botao==='ok' && a.fole==='errado') return t('você tocou {}: botão certo, fole na direção errada', tocado);
  if(a.nota && a.fole==='errado') return t('você tocou {}: nota certa, mas com o fole na direção errada', tocado);
  if(a.fole==='errado') return t('você tocou {}: botão diferente e fole na direção errada', tocado);
  return t('você tocou {}: botão diferente do pedido', tocado);
}
function registrar(e, a, toque, agora){
  const r = acad.res[e.k];
  r.tentativas++;
  if(!r.primeira) r.primeira = {...a, perdida:false, tocado:toque};
  if(a.certo && !r.ok){ r.ok = true; r.ini = agora; if(toque.botao) acad.porBotao[toque.mao+toque.botao.id] = e.k; }
  // Nível 1 alimenta o sorteio inteligente e o mapa de erros dos Desafios
  if(acad.ex.nivel===1 && r.tentativas===1 && toque.botao){
    const s = state.progress.btnStats[statKey(e.mao, e.botao.id, e.fole)] = state.progress.btnStats[statKey(e.mao, e.botao.id, e.fole)] || {ok:0, err:0};
    a.certo ? s.ok++ : s.err++;
  }
}

/* ---------- Toques ---------- */
const agoraSeg = () => performance.now()/1000;
function acadToque(b, m, dir, k){
  if(acad.demo) return;
  if(!acad.rodando && !acadComecarPorToque()) return;
  const toque = {botao:b, mao:k.hand, midi:m, fole:dir, fonte:'tela'};
  if(acad.modo==='desafio' && !acad.ex.semTempo) toqueNoTempo(toque, ac().currentTime - (AC.outputLatency||0));
  else toqueEspera(toque);
}
function acadSoltou(b){
  for(const lado of ['left','right']){
    const k = acad.porBotao[lado+b.id];
    if(k!=null && acad.res[k] && acad.res[k].fim==null){ acad.res[k].fim = agoraSeg(); delete acad.porBotao[lado+b.id]; }
  }
}
// microfone (microfone.js chama quando a aba Academia está aberta)
function acadOuvir(m){
  if(acad.demo || !acad.rodando) return;
  const toque = {botao:null, mao:null, midi:m, fole:null, fonte:'microfone'};
  if(acad.modo==='desafio' && !acad.ex.semTempo) toqueNoTempo(toque, AC.currentTime - MIC_LATENCY);
  else toqueEspera(toque);
}
// Aprender e Praticar: o momento só avança quando todas as notas dele estiverem certas
function toqueEspera(toque){
  const pend = [...acad.pend].map(k=>acad.eventos[k]); if(!pend.length) return;
  const cands = pend.map(e=>({e, a:avaliar(e, toque)}));
  const hit = cands.find(c=>c.a.certo), agora = agoraSeg();
  if(hit){
    registrar(hit.e, hit.a, toque, agora); acad.pend.delete(hit.e.k);
    akOf(hit.e.mao).unmark(hit.e.botao.id,'guia'); akOf(hit.e.mao).mark(hit.e.botao.id,'ok',350);
    const extra = hit.a.botao==='alternativo' ? ' ' + t('(outro botão com a mesma nota; o sugerido é o destacado)') : '';
    acadFeed(acad.pend.size ? t('Certo! Falta a outra nota deste momento.') : t('Certo!') + extra, 'ok'); pulsoInstrutor('ok');
    if(!acad.pend.size){ faixaMarca(acad.g, acad.grupos[acad.g].ks.some(k=>acad.res[k].tentativas>1) ? 'bad' : 'ok'); avancar(); }
  } else {
    const c = cands.find(c=>toque.botao && c.e.mao===toque.mao && c.e.botao.id===toque.botao.id) || cands.find(c=>c.e.mao===toque.mao) || cands[0];
    registrar(c.e, c.a, toque, agora); acad.erros++;
    if(toque.botao) akOf(toque.mao).mark(toque.botao.id,'bad',400);
    pulsoInstrutor('erro');
    acadFeed(t('Pedido: {} ({}); {}.', nomeEvento(c.e), maoNome(c.e.mao), diferenca(c.e, c.a, toque)), 'bad');
    // no Praticar o botão certo só aparece depois de 2 erros na mesma nota
    if(acad.modo!=='aprender' && !acad.ex.semAjuda && acad.res[c.e.k].tentativas>=2) akOf(c.e.mao).mark(c.e.botao.id,'guia',0);
  }
}
function avancar(){
  acad.g++;
  if(acad.g >= acad.grupos.length){ acadFim(); return; }
  const g = acad.grupos[acad.g]; acad.pend = new Set(g.ks);
  if(acadFoleAuto() && g.fole!==acad.dir) acadSetDir(g.fole);
  faixaMarca(acad.g,'cur'); acadInstrutor(acad.g); acadDica(acad.g);
}
// Desafio: cada nota tem um instante certo; vale a mais próxima dentro da janela
function toqueNoTempo(toque, quando){
  const janela = Math.min(0.35, Math.max(0.18, 0.45*acad.spb));
  const cands = acad.eventos.filter(e=>!acad.res[e.k].julgado && Math.abs(e.tAlvo-quando)<janela);
  if(!cands.length){ acad.foraDoTempo++; acadFeed(t('Fora do tempo'),'bad'); return; }
  const av = cands.map(e=>({e, a:avaliar(e, toque)}));
  const pool = av.some(x=>x.a.certo) ? av.filter(x=>x.a.certo) : av.some(x=>x.a.mao) ? av.filter(x=>x.a.mao) : av;
  const {e, a} = pool.reduce((x,y)=>Math.abs(y.e.tAlvo-quando)<Math.abs(x.e.tAlvo-quando)?y:x);
  const r = acad.res[e.k]; r.julgado = true; r.dt = quando - e.tAlvo; r.tAudio = quando;
  registrar(e, a, toque, agoraSeg());
  const ms = Math.round(r.dt*1000);
  if(a.certo){ acadFeed(Math.abs(ms)<=Math.round(tolRitmo()*1000) ? t('No tempo!') : ms<0 ? t('Certo, adiantado {} ms', -ms) : t('Certo, atrasado {} ms', ms), 'ok'); }
  else { acad.erros++; acadFeed(t('Pedido: {} ({}); {}.', nomeEvento(e), maoNome(e.mao), diferenca(e, a, toque)), 'bad'); }
  const g = acad.grupos[e.grupo];
  if(g.ks.every(k=>acad.res[k].julgado)) faixaMarca(e.grupo, g.ks.every(k=>acad.res[k].primeira && acad.res[k].primeira.certo) ? 'ok' : 'bad');
}
const tolRitmo = () => Math.min(0.12, Math.max(0.06, 0.1*acad.spb)); // tolerância do ritmo: 60 a 120 ms

/* ---------- Começar, ouvir, parar ---------- */
function acadParar(){
  acad.timers.forEach(clearTimeout); acad.timers = [];
  if(acad.raf) cancelAnimationFrame(acad.raf); acad.raf = null;
  if(acad.bus){ acad.bus.disconnect(); acad.bus = null; }
  acad.rodando = false; acad.demo = false;
  $('#acStart').textContent = t('▶ Começar'); $('#acOuvirBtn').textContent = t('Ouvir');
}
function novaRodada(){
  acad.res = acad.eventos.map(()=>({tentativas:0, primeira:null, ok:false}));
  acad.erros = 0; acad.foraDoTempo = 0; acad.porBotao = {}; acad.g = -1; acad.inicioMs = performance.now();
  $$('#acStrip .mcard').forEach(c=>c.classList.remove('ok','bad','cur'));
  $('#acRelatorio').innerHTML = '';
}
$('#acStart').onclick = ()=>{
  if(acad.rodando || acad.demo){ acadParar(); acadPrevia(); acadFeed(t('Parado.')); return; }
  if(!acad.eventos.length) return;
  ac(); acad.rodando = true; novaRodada(); renderFaixa(); acadRecolher(true); $('#acMais').open = false;
  $('#acStart').textContent = t('■ Parar'); acadFeed('');
  // nível 1: notas novas a cada rodada, mas só ao apertar Começar depois de uma rodada (tocar o botão da prévia usa as notas mostradas)
  if(acad.ex.nivel===1 && acad.ex.gerar && acad.sortearDeNovo && !acad.autoInicio){ acad.todos = montarEventos(acad.ex); aplicarTrecho(); acad.rodando = true; novaRodada(); }
  acad.sortearDeNovo = false; acadInstrutor(0);
  if(acad.modo==='desafio' && !acad.ex.semTempo) iniciarNoTempo(); else avancar();
  if(window.innerWidth<980 && !acad.autoInicio) $('#acInstrutor').scrollIntoView({block:'start', behavior:'smooth'}); // no celular o instrutor fica logo acima do teclado
};
$('#acOuvirBtn').onclick = ()=>{
  if(acad.demo || acad.rodando){ acadParar(); acadDica(-1); return; }
  if(!acad.eventos.length) return;
  ac(); acad.demo = true; renderFaixa(); $('#acOuvirBtn').textContent = t('■ Parar');
  const c = ac(), spb = 60/(acad.bpm*acadVel()), t0 = c.currentTime + 0.3;
  if($('#acMetro').checked) for(let bt=0; bt < totalTempos(); bt++) clickSound(t0 + bt*spb, bt%4===0);
  acad.grupos.forEach((g,i)=>{
    const evs = g.ks.map(k=>acad.eventos[k]);
    evs.forEach(e=>playNote(e.midi, e.duracao*spb*0.92, e.mao, t0 + g.inicio*spb));
    acad.timers.push(setTimeout(()=>{
      if(g.fole!==acad.dir) acadSetDir(g.fole);
      faixaMarca(i,'cur'); acadInstrutor(i); acadDica(i);
      evs.forEach(e=>akOf(e.mao).mark(e.botao.id,'down', e.duracao*spb*900));
    }, 300 + g.inicio*spb*1000));
  });
  acad.timers.push(setTimeout(()=>{ acadParar(); renderFaixa(); acadInstrutor(0); acadPrevia(); }, 600 + totalTempos()*spb*1000));
};
const totalTempos = () => Math.max(0, ...acad.eventos.map(e=>e.inicio+e.duracao));
function iniciarNoTempo(){
  const c = ac(), spb = 60/(acad.bpm*acadVel()), t0 = c.currentTime + 0.4, start = t0 + 4*spb;
  acad.spb = spb; acad.bus = c.createGain(); acad.bus.connect(master);
  acad.eventos.forEach(e=>{ e.tAlvo = start + e.inicio*spb; });
  const fim = start + totalTempos()*spb;
  for(let bt=t0, k=0; bt < fim-0.01; bt+=spb, k++) if(k<4 || $('#acMetro').checked) clickSound(bt, k<4 || (k-4)%4===0, acad.bus);
  let ultimoG = -1;
  const tick = ()=>{
    const now = c.currentTime;
    if(now < start) acadFeed(t('Prepare-se… {}', Math.max(1, 4-Math.floor((now-t0)/spb))));
    const jan = Math.min(0.35, Math.max(0.18, 0.45*spb));
    for(const e of acad.eventos){ const r = acad.res[e.k];
      if(!r.julgado && e.tAlvo < now-jan){ r.julgado = true; r.primeira = r.primeira || {perdida:true, certo:false}; acad.erros++;
        const g = acad.grupos[e.grupo]; if(g.ks.every(k=>acad.res[k].julgado)) faixaMarca(e.grupo,'bad'); } }
    const up = acad.eventos.find(e=>!acad.res[e.k].julgado && e.tAlvo > now-jan);
    if(up && up.grupo!==ultimoG){ ultimoG = up.grupo; acad.g = up.grupo; acad.pend = new Set(acad.grupos[up.grupo].ks);
      if(acadFoleAuto() && acad.grupos[up.grupo].fole!==acad.dir) acadSetDir(acad.grupos[up.grupo].fole);
      faixaMarca(up.grupo,'cur'); acadInstrutor(up.grupo); acadDica(up.grupo); }
    if(now > fim + 0.4){ acadFim(); return; }
    acad.raf = requestAnimationFrame(tick);
  };
  acad.raf = requestAnimationFrame(tick);
}

/* ---------- Relatório ---------- */
function faixas(ns){ // [3,4,5,9] → "3–5, 9"
  const out = []; let a = null, b = null;
  for(const n of ns){ if(a!=null && n===b+1) b = n; else { if(a!=null) out.push(a===b ? `${a}` : `${a}–${b}`); a = b = n; } }
  if(a!=null) out.push(a===b ? `${a}` : `${a}–${b}`);
  return out.join(', ');
}
function acadFim(){
  const noTempo = acad.modo==='desafio' && !acad.ex.semTempo;
  acadParar(); acadDica(-1); acad.sortearDeNovo = true; $$('#acStrip .mcard.cur').forEach(x=>x.classList.remove('cur'));
  const evs = acad.eventos, R = acad.res, N = evs.length, de = +$('#acDe').value;
  const num = e => e.k + de; // número da nota no exercício inteiro
  const certas = evs.filter(e=>R[e.k].primeira && R[e.k].primeira.certo);
  const pctNotas = Math.round(100*certas.length/N);
  const seg = Math.round((performance.now()-acad.inicioMs)/1000);
  const linhas = [], recs = [];
  linhas.push(t('Você executou corretamente {} de {} notas na primeira tentativa ({}%).', certas.length, N, pctNotas));
  // ritmo (só no tempo)
  let pctRitmo = null;
  if(noTempo && certas.length){
    const dts = certas.map(e=>R[e.k].dt), noTempoOk = dts.filter(d=>Math.abs(d)<=tolRitmo()).length;
    pctRitmo = Math.round(100*noTempoOk/certas.length);
    const media = Math.round(1000*dts.reduce((a,b)=>a+b,0)/dts.length);
    linhas.push(t('Ritmo: {}% das notas certas entraram no tempo (±{} ms).', pctRitmo, Math.round(tolRitmo()*1000))
      + (Math.abs(media)>=25 ? ' ' + (media<0 ? t('Em média você adiantou {} ms.', -media) : t('Em média você atrasou {} ms.', media)) : ''));
    if(pctRitmo<80) recs.push(t('Ligue o metrônomo, baixe a velocidade para {}% e toque junto com o clique, sem {}.', Math.max(40, +$('#acVel').value-20), t(media<0 ? 'adiantar' : 'atrasar')));
  }
  // fole
  const comFole = evs.filter(e=>R[e.k].primeira && ['ok','errado'].includes(R[e.k].primeira.fole));
  const errosFole = comFole.filter(e=>R[e.k].primeira.fole==='errado');
  if(comFole.length) linhas.push(t('Direção do fole: {}% certa ({} de {}).', Math.round(100*(comFole.length-errosFole.length)/comFole.length), comFole.length-errosFole.length, comFole.length));
  else if(acadFoleAuto()) linhas.push(t('Direção do fole: automática (não avaliada).'));
  else if(mic.on) linhas.push(t('Direção do fole: não verificada pelo microfone.'));
  // dedo: só afirma quando houve verificação
  const dedos = evs.map(e=>R[e.k].primeira && R[e.k].primeira.dedo).filter(Boolean);
  if(dedos.some(d=>d==='verificado'||d==='incorreto')){
    const ok = dedos.filter(d=>d==='verificado').length, tot = dedos.filter(d=>d==='verificado'||d==='incorreto').length;
    linhas.push(t('Dedilhado verificado: {} de {} certos.', ok, tot));
  } else linhas.push(evs.some(e=>e.dedo!=null) ? t('Dedilhado: apenas sugerido. O app não identifica qual dedo você usou, então ele não entra na nota.') : t('Dedilhado: o app não indica nem confere o dedo neste exercício. Escolha a digitação com o seu professor.'));
  linhas.push(t('Tempo de conclusão: {}.', `${Math.floor(seg/60)}:${String(seg%60).padStart(2,'0')}`));
  // erros, com a diferença entre o pedido e o tocado
  const errados = evs.filter(e=>!(R[e.k].primeira && R[e.k].primeira.certo));
  errados.slice(0,3).forEach(e=>{
    const p = R[e.k].primeira;
    linhas.push(p && !p.perdida ? t('Na nota {} ({}, {}), {}.', num(e), nomeEvento(e), maoNome(e.mao), diferenca(e, p, p.tocado))
      : t('Na nota {} ({}, {}), a nota não foi tocada a tempo.', num(e), nomeEvento(e), maoNome(e.mao)));
  });
  if(errados.length>3) linhas.push(t('E mais {} nota(s) com erro.', errados.length-3));
  // articulação (legato/staccato), medida pelo tempo em que cada botão ficou apertado
  const art = acad.ex.articulacao;
  if(art && acad.modo!=='aprender'){
    const pares = evs.slice(0,-1).map((e,i)=>[e, evs[i+1]]).filter(([a,b])=>a.mao===b.mao && R[a.k].ini!=null && R[b.k].ini!=null);
    const gap = ([a,b]) => R[b.k].ini - (R[a.k].fim ?? R[b.k].ini); // < 0: os dois botões ficaram apertados juntos
    const ruins = pares.filter(p => art==='legato' ? gap(p) > 0.06 : gap(p) < 0.08);
    if(pares.length){
      linhas.push(t('Articulação ({}): {} de {} passagens certas.', t(art), pares.length-ruins.length, pares.length));
      if(ruins.length) recs.push(art==='legato' ? t('Legato: segure cada botão até apertar o próximo. Reveja as passagens das notas {}.', faixas(ruins.map(([a])=>num(a))))
        : t('Staccato: solte o botão antes de apertar o próximo, deixando um pequeno silêncio. Reveja as notas {}.', faixas(ruins.map(([a])=>num(a)))));
    }
  }
  // trocas de fole sem interromper a frase
  if(acad.ex.verificaTroca && noTempo){
    const trocas = acad.grupos.slice(1).map((g,i)=>[acad.grupos[i], g]).filter(([a,b])=>a.fole!==b.fole);
    const buracos = trocas.map(([a,b])=>{ const ea = acad.eventos[a.ks[0]], eb = acad.eventos[b.ks[0]];
      return R[ea.k].fim!=null && R[eb.k].ini!=null ? {nota:num(eb), ms:Math.round(1000*(R[eb.k].ini-R[ea.k].fim))} : null; }).filter(Boolean);
    const longos = buracos.filter(b=>b.ms > 150);
    if(buracos.length) linhas.push(t('Trocas de fole: {} de {} sem interromper a frase.', buracos.length-longos.length, buracos.length));
    if(longos.length) recs.push(t('Na troca de fole antes da nota {}, houve {} ms de silêncio. Prepare a troca no fim da nota anterior e troque junto com o novo botão.', longos[0].nota, longos[0].ms));
  }
  // sincronia das mãos
  if(acad.ex.verificaSincronia && noTempo){
    const difs = acad.grupos.map(g=>g.ks.map(k=>acad.eventos[k])).filter(es=>es.some(e=>e.mao==='left') && es.some(e=>e.mao==='right'))
      .map(es=>{ const tl = es.filter(e=>e.mao==='left').map(e=>R[e.k].tAudio).find(x=>x!=null), tr = es.filter(e=>e.mao==='right').map(e=>R[e.k].tAudio).find(x=>x!=null);
        return tl!=null && tr!=null ? Math.abs(tl-tr)*1000 : null; }).filter(x=>x!=null);
    if(difs.length){ const m = Math.round(difs.reduce((a,b)=>a+b,0)/difs.length);
      linhas.push(t('Sincronia: as mãos entraram com {} ms de diferença em média.', m));
      if(m>60) recs.push(t('Toque devagar (a {}% da velocidade) contando em voz alta e apertando os dois botões no mesmo instante.', Math.max(40, +$('#acVel').value-20))); }
  }
  // trechos para revisar e recomendação principal
  if(errados.length) linhas.push(t('Trechos para revisar: notas {}.', faixas(errados.map(num))));
  const nFole = errados.filter(e=>R[e.k].primeira && R[e.k].primeira.fole==='errado').length;
  if(errados.length && nFole*2 >= errados.length) recs.unshift(t('A maioria dos erros foi de fole. Faça o exercício "{}" do Nível 4 e depois repita este no modo Aprender.', t('Alternar a direção')));
  else if(errados.length) recs.unshift(t('Repita as notas {} no modo Aprender, a {}% da velocidade, antes de aumentar.', faixas(errados.map(num)), Math.max(40, +$('#acVel').value-20)));
  // progresso, velocidade e auxílios (o Desafio se ajusta à sua precisão)
  const p = progEx(acad.ex.id); p.vezes++;
  const nota = pctRitmo==null ? pctNotas : Math.round((pctNotas+pctRitmo)/2);
  if(!(p.melhor[acad.modo] >= nota)) p.melhor[acad.modo] = nota;
  if(acad.modo==='desafio'){
    const semProblemas = !recs.length && !errados.length;
    if(pctNotas>=90 && (pctRitmo==null || pctRitmo>=80) && semProblemas){
      if(p.ajuda>0){ p.ajuda--; recs.push(t('Ótimo! Na próxima vez o Desafio terá menos auxílio visual.')); }
      else if(!acad.ex.semTempo && +$('#acVel').value<120){ p.vel = Math.min(120, +$('#acVel').value+10); $('#acVel').value = p.vel; $('#acVelVal').textContent = p.vel+'%'; recs.push(t('Ótimo! Velocidade aumentada para {}%.', p.vel)); }
    } else if(pctNotas<70){
      p.ajuda = Math.min(2, p.ajuda+1);
      if(!acad.ex.semTempo){ p.vel = Math.max(40, +$('#acVel').value-10); $('#acVel').value = p.vel; $('#acVelVal').textContent = p.vel+'%'; recs.push(t('Velocidade reduzida para {}% e auxílios de volta.', p.vel)); }
    }
  }
  if(!recs.length) recs.push(acad.modo==='aprender' ? t('Muito bem! Agora toque no modo Praticar, sem o destaque dos botões.')
    : acad.modo==='praticar' ? t('Muito bem! Agora tente o modo Desafio, no tempo.') : t('Muito bem! Siga para o próximo exercício.'));
  saveProgress(); renderAcadNiveis(); renderAcadLista(); logPractice('academia');
  if(typeof aposRelatorio==='function') setTimeout(aposRelatorio, 0); // botão "Enviar ao professor" (js/professor.js)
  if(pctNotas>=90 && !errados.length && (pctRitmo==null || pctRitmo>=80)) comemorar();
  const prox = proximoExercicio();
  $('#acRelatorio').innerHTML = `<h3>${t('Resultado')}</h3><ul>${linhas.map(l=>`<li>${l}</li>`).join('')}</ul>`
    + `<p class="ac-rec"><b>${t('Recomendação:')}</b> ${recs[0]}</p>` + recs.slice(1).map(r=>`<p class="ac-rec">${r}</p>`).join('')
    + `<div class="row">${errados.length && !acad.ex.semTempo ? `<button class="btn" id="acRevisar">${t('Repetir o trecho com erros')}</button>` : ''}`
    + `<button class="btn sec" id="acDeNovo">${t('Repetir')}</button>${prox ? `<button class="btn sec" id="acProx">${t('Próximo exercício')}</button>` : ''}</div>`;
  acadFeed(pctNotas>=80 ? t('Concluído! {}%', nota) : t('Concluído. {}%', nota), pctNotas>=80 ? 'ok' : 'bad');
  if($('#acRevisar')) $('#acRevisar').onclick = ()=>{
    const ns = errados.map(num), a = Math.max(1, ns[0]-1), b = Math.min(acad.todos.length, ns[ns.length-1]+1);
    $('#acDe').value = a; $('#acAte').value = b; aplicarTrecho(); $('#acModo [data-modo="aprender"]').click(); $('#acStart').click(); };
  $('#acDeNovo').onclick = ()=>$('#acStart').click();
  if(prox) $('#acProx').onclick = ()=>{ acad.nivel = prox.nivel; renderAcadNiveis(); carregarExercicio(prox.id); };
  $('#acRelatorio').scrollIntoView({block:'nearest', behavior:'smooth'});
  if($('#acRepetir').checked && pctNotas<100) acad.timers.push(setTimeout(()=>$('#acStart').click(), 2500));
}
function proximoExercicio(){
  const lista = todosExercicios().filter(e=>!e.pendente), i = lista.findIndex(e=>e.id===acad.ex.id);
  return lista[i+1] || null;
}

/* ---------- Modo, guia e visualização ---------- */
$('#acModo').addEventListener('click', ev=>{
  const b = ev.target.closest('[data-modo]'); if(!b) return;
  acadParar(); acad.modo = b.dataset.modo; store.set('acadModo', acad.modo);
  $$('#acModo [data-modo]').forEach(x=>x.classList.toggle('on', x===b));
  $('#acModoInfo').textContent = {aprender:'O app mostra o próximo botão, o dedo e o fole. Só avança quando você toca a nota certa.',
    praticar:'A sequência inteira aparece na faixa. Toque no seu ritmo; o botão certo só aparece depois de 2 erros.',
    desafio:'No tempo, com contagem e metrônomo. Os auxílios diminuem conforme a sua precisão.'}[acad.modo];
  renderFaixa(); acadInstrutor(0); acadPrevia();
});
['#acGuia','#acMaosVer','#acNomes'].forEach(s=>$(s).addEventListener('change', ()=>{ store.set(s.slice(1), $(s).checked); renderFaixa(); acadInstrutor(Math.max(0,acad.g)); if(acad.rodando) acadDica(acad.g); refreshAll(); }));
$('#acAmpliar').addEventListener('change', e=>{ $('#acInstrutor').classList.toggle('grande', e.target.checked); store.set('acAmpliar', e.target.checked); });
$('#acMic').onchange = async e=>{
  if(e.target.checked){ if(!await micStart()) e.target.checked = false; }
  else micStop();
  $('#micToggle').checked = e.target.checked; acadValidacaoTexto();
};
// Ao abrir a aba: teclados no tamanho da área central e o exercício salvo
function acadMostrar(){
  [akL, akR].forEach(k=>{ const bs = state.layout[k.hand], maxX = Math.max(...bs.map(b=>b.x));
    if(autoKeySize(maxX, 1, acadLarguraTeclado()) !== k.size) k.build(); });
  if(acad.ex){ if(acad.rodando) acadDica(acad.g); else if(!acad.demo) acadPrevia(); }
  $('#acMic').checked = mic.on; acadValidacaoTexto();
  if(typeof acListaMelodias==='function') acListaMelodias(); // melodias salvas depois em Melodias
}
function acadAoMudarMapa(){ if(acad.ex) carregarExercicio(acad.ex.id); }
// Tela Início: "Continue de onde parou" com o exercício atual da Academia (só depois da 1ª tentativa)
function renderContinuar(){
  const el = $('#continuar'); if(!el || typeof acad==='undefined' || !acad.ex) return;
  const usou = Object.keys(state.progress.academia||{}).length > 0;
  el.hidden = !usou; if(!usou) return;
  el.innerHTML = `<div><p class="kicker">${t('Continue de onde parou')}</p><b>${t('Academia · Nível {}: {}', acad.ex.nivel, t(acad.ex.titulo))}</b>`
    + `<div class="muted">${acad.ex.desc}</div></div>`
    + `<button type="button" class="btn" data-go="academia"><svg aria-hidden="true"><use href="#i-play"/></svg>${t('Continuar')}</button>`;
}

// Estado inicial
maos.montar($('#acMaos'));
['acGuia','acMaosVer','acNomes'].forEach(id=>{ const v = store.get(id, null); if(v!=null) $('#'+id).checked = v; });
if(store.get('acAmpliar', false)){ $('#acAmpliar').checked = true; $('#acInstrutor').classList.add('grande'); }
acadSetDir('open');
renderAcadNiveis();
carregarExercicio(exercicioPorId(store.get('acadEx', '')) ? store.get('acadEx') : 'n1-direita');
acad.nivel = acad.ex.nivel; renderAcadNiveis(); renderAcadLista(); renderContinuar();
$(`#acModo [data-modo="${store.get('acadModo','aprender')}"]`).click();
