// Testes automáticos: rode com  python tests/rodar_testes.py
const TESTES = [];
const teste = (nome, fn) => TESTES.push({nome, fn});
const ok = (cond, msg) => { if(!cond) throw new Error(msg || 'condição falsa'); };
const igual = (a, b, msg) => {
  if(JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg ? msg + ': ' : ''}esperado ${JSON.stringify(b)}, obtido ${JSON.stringify(a)}`);
};
// avança a simulação do fole sem depender de requestAnimationFrame (headless)
const passarTempoFole = ms => { for(let t=0; t<ms; t+=50) bellowsLoop(bel.last + 50); };
const tecla = (tipo, code) => document.dispatchEvent(new KeyboardEvent(tipo, {code, bubbles:true}));
const tocarEspera = () => { let n=0; while(mel.running && n++<5000){ const c=pendingNotes()[0]; melPress(c.btn, c.midi, c.dir); } };

/* ---------- Base ---------- */
teste('página carrega sem erros de JavaScript', () => igual(window.__erros, []));
teste('mapa Rheinische 142: 38 + 33 botões', () => {
  igual(state.layout.right.length, 38); igual(state.layout.left.length, 33);
});
teste('nomes de notas e leitura de notas digitadas', () => {
  igual(parseNote('Dó4'), 60); igual(parseNote('F#3'), 54); igual(parseNote('Sib4'), 70); igual(parseNote('b4'), 71);
  igual(noteName(61), state.names==='pt' ? 'Dó♯4' : 'C♯4');
});

/* ---------- Fole e válvula ---------- */
teste('válvula: A abre e F fecha sem mudar a direção', () => {
  ligarPc(false); go('teclado'); bel.level = 0.5; setDir('open');
  tecla('keydown','KeyF'); passarTempoFole(400); tecla('keyup','KeyF');
  ok(bel.level < 0.5, 'F deveria fechar'); igual(state.dir, 'open');
  const l = bel.level; tecla('keydown','KeyA'); passarTempoFole(400); tecla('keyup','KeyA');
  ok(bel.level > l, 'A deveria abrir'); igual(bel.valve, null);
});
teste('setas seguram a válvula mesmo com o teclado do computador tocando notas', () => {
  const antes = pc.ligado; ligarPc(true); go('teclado'); bel.level = 0.5; setDir('open');
  tecla('keydown','ArrowRight'); passarTempoFole(400); tecla('keyup','ArrowRight');
  ok(bel.level < 0.5, '→ deveria fechar'); igual(bel.valve, null); ligarPc(antes);
});
teste('fole no limite bloqueia e a válvula libera', () => {
  ligarPc(false);
  bel.level = 1; setDir('open'); bel.blocked = true;
  tecla('keydown','KeyF'); passarTempoFole(200); tecla('keyup','KeyF');
  igual(bel.blocked, false);
});

/* ---------- Melodias ---------- */
teste('todas as melodias prontas têm todas as notas no mapa', () => {
  for(const x of BUILTIN_MELODIES){
    const m = parseMelody(x.text); fingerMelody(m);
    igual(m.bad, [], x.id); igual(m.notes.filter(n=>n.error).length, 0, x.id);
  }
});
teste('formato de texto: tercinas, pontos, ligaduras e pausas', () => {
  const m = parseMelody('título: t\nDó4:8t Ré4:8t Mi4:8t Fá4:4. Sol4:8 | Lá4:2~ | Lá4:4 p:4');
  igual(m.notes.map(n=>+n.beats.toFixed(3)), [0.333,0.333,0.333,1.5,0.5,3,1]);
});
teste('modo Espera completo registra 100%', () => {
  go('melodias'); loadMelody('ode'); $('#melMode').value='wait'; $('#melAuto').checked=true; $('#melStart').click();
  tocarEspera(); ok(/100%/.test($('#melFeed').textContent), $('#melFeed').textContent);
});
teste('dedilhado escala para 1200 notas em menos de 500 ms', () => {
  const m = parseMelody('título: x\n' + Array(150).fill('Dó4:8 Ré4:8 Mi4:8 Fá4:8 Sol4:8 Lá4:8 Si4:8 Dó5:8').join(' '));
  const t0 = performance.now(); fingerMelody(m); ok(performance.now()-t0 < 500);
});

/* ---------- MusicXML ---------- */
const XML_TESTE = `<?xml version="1.0"?><score-partwise version="3.1"><work><work-title>T</work-title></work>
<part-list><score-part id="P1"><part-name>Band</part-name></score-part></part-list><part id="P1">
<measure number="1"><attributes><divisions>6</divisions><staves>2</staves></attributes><direction><sound tempo="100"/></direction>
<note><pitch><step>C</step><octave>5</octave></pitch><duration>6</duration><staff>1</staff></note>
<note><chord/><pitch><step>E</step><octave>5</octave></pitch><duration>6</duration><staff>1</staff></note>
<note><grace/><pitch><step>A</step><octave>5</octave></pitch><staff>1</staff></note>
<note><pitch><step>E</step><octave>5</octave></pitch><duration>2</duration><staff>1</staff></note>
<note><pitch><step>F</step><alter>1</alter><octave>5</octave></pitch><duration>2</duration><staff>1</staff></note>
<note><pitch><step>G</step><octave>5</octave></pitch><duration>2</duration><staff>1</staff></note>
<note><pitch><step>B</step><alter>-1</alter><octave>5</octave></pitch><duration>12</duration><tie type="start"/><staff>1</staff></note>
<backup><duration>24</duration></backup><note><pitch><step>C</step><octave>3</octave></pitch><duration>24</duration><staff>2</staff></note></measure>
<measure number="2"><note><pitch><step>B</step><alter>-1</alter><octave>5</octave></pitch><duration>6</duration><tie type="stop"/><staff>1</staff></note>
<note><rest/><duration>18</duration><staff>1</staff></note><backup><duration>24</duration></backup>
<note><pitch><step>A</step><octave>2</octave></pitch><duration>24</duration><staff>2</staff></note></measure></part></score-partwise>`;
teste('MusicXML: acorde, enfeite, tercina e ligadura', () => {
  const sc = parseMusicXML(XML_TESTE); igual(sc.tempo, 100); igual(sc.parts[0].staves, 2);
  const r = melodyFromScore(sc, {part:0, staff:'1', pick:'high', hand:'right', fitOctave:false});
  ok(r.text.includes('Mi5:4 Mi5:8t Fá#5:8t Sol5:8t Lá#5:2~ | Lá#5:4'), r.text);
  const m = parseMelody(r.text);
  igual(m.notes.filter(n=>!n.rest).map(n=>n.beats.toFixed(2)), ['1.00','0.33','0.33','0.33','3.00']);
});

/* ---------- Escalas ---------- */
teste('escalas: grafia correta', () => {
  const nomes = (t,pc) => scaleNotes(t,pc,validStarts(t,pc,'right',1)[0],1,'up').map(n=>spellName(n)).join(' ');
  if(state.names==='pt'){
    igual(nomes('maior',5), 'Fá Sol Lá Si♭ Dó Ré Mi Fá');
    igual(nomes('harmonica',9), 'Lá Si Dó Ré Mi Fá Sol♯ Lá');
  }
});
teste('escalas: pelo menos 231 das 240 combinações cabem no instrumento', () => {
  let n = 0;
  for(const t in SCALE_TYPES) for(const h of ['right','left']) for(const o of [1,2]) for(let pc=0; pc<12; pc++) if(validStarts(t,pc,h,o).length) n++;
  ok(n >= 231, n + ' combinações');
});

/* ---------- Som ---------- */
teste('som: o arquivo de amostras chega depois e toda nota do mapa tem amostra (transposição até 7 semitons)', async () => {
  await carregarSons(); ok(SF, 'amostras não carregaram');
  for(const h of ['left','right']) for(const b of state.layout[h]) for(const d of ['open','close']){
    const z = sfZone(b[d]); ok(Math.abs(b[d]-z.root) <= 7, 'nota ' + b[d]);
  }
});


/* ---------- Ajustes ---------- */
teste('afinação muda a velocidade das amostras e a frequência do sintetizado', async () => {
  await carregarSons(); ac();
  const antes = state.tuning;
  state.tuning = 443; const r443 = makeSampleVoice(69, 0, AC.currentTime).oscs[0].playbackRate.value;
  state.tuning = 440; const r440 = makeSampleVoice(69, 0, AC.currentTime).oscs[0].playbackRate.value;
  ok(Math.abs(r440/r443 - 440/443) < 1e-6); igual(Math.round(freq(69)), 440);
  state.tuning = antes;
});
teste('aba Ajustes existe e o cabeçalho não tem mais seletores', () => {
  go('ajustes'); ok($('#v-ajustes').classList.contains('active')); ok(!document.querySelector('header select'));
  ok($('#subnav [data-v="ajustes"]').hasAttribute('aria-current')); ok($('#nav [data-area="perfil"]').hasAttribute('aria-current'));
});
teste('botões do teclado têm descrição para leitores de tela', () => {
  ok(/abrindo, .* fechando/.test(document.querySelector('#kbRight .key').getAttribute('aria-label')));
});


/* ---------- Celular ---------- */
teste('tamanho dos botões se adapta à largura da tela', () => {
  const W = document.documentElement.clientWidth;
  const s = autoKeySize(7.43, 2); ok(s>=30 && s<=48, 'tamanho '+s);
  if(W>=1000) igual(s, 48, 'na tela larga deve usar o tamanho máximo');
});


/* ---------- Melodias: interface ---------- */
teste('seletor de melodias lista as prontas e abre a escolhida', () => {
  go('melodias'); stopMelody();
  igual($$('#melSelect optgroup[label="Prontas"] option').length, BUILTIN_MELODIES.length);
  $('#melSelect').value='estrelinha'; $('#melSelect').dispatchEvent(new Event('change'));
  igual(mel.cur.id, 'estrelinha');
});
teste('escala guiada aparece no seletor e o gerador fecha', () => {
  $('#scaleOpen').click(); igual($('#scaleCard').style.display, 'block');
  $('#scGo').click(); igual($('#scaleCard').style.display, 'none');
  ok($('#melSelect').value.startsWith('esc:'), $('#melSelect').value);
});


/* ---------- Microfone ---------- */
const senoide = (f, sr, n, harm=[1]) => { const b=new Float32Array(n);
  for(let i=0;i<n;i++) b[i]=harm.reduce((s,a,k)=>s+a*Math.sin(2*Math.PI*f*(k+1)*i/sr),0)*0.3; return b; };
teste('detecção de altura: senoides e timbres com harmônicos', () => {
  const sr=48000, a=state.tuning; state.tuning=440;
  for(const [f,m] of [[440,69],[65.41,36],[987.77,83],[130.81,48]]){
    const r=detectPitch(senoide(f,sr,2048,[1,0.6,0.4,0.3,0.2]),sr); ok(r, 'sem detecção em '+f);
    igual(Math.round(freqToMidi(r.freq)), m, f+' Hz');
  }
  igual(detectPitch(new Float32Array(2048),sr), null, 'silêncio');
  state.tuning=a;
});
teste('detecção de altura no som gravado do bandoneon (todas as amostras)', async () => {
  await carregarSons(); ac(); if(!SF) throw new Error('amostras não carregaram'); const a=state.tuning; state.tuning=443;
  SF.samples.forEach((s,i)=>{
    const ch=sfBuffer(i).getChannelData(0), z=SF.zones.find(z=>z.s===i);
    const r=detectPitch(ch.slice(s.loopStart, s.loopStart+2048), s.rate); ok(r, s.name+' sem detecção');
    const m=Math.round(freqToMidi(r.freq)); ok(micMatches(m, z.root), `${s.name}: ouvi ${m}, raiz ${z.root}`);
  });
  state.tuning=a;
});
teste('microfone no modo Espera completa a melodia', () => {
  go('melodias'); loadMelody('esc-do'); $('#melMode').value='wait'; $('#melStart').click();
  let n=0; while(mel.running && n++<100) onMicNote(pendingNotes()[0].midi + (n%2?12:0));
  ok(/100%/.test($('#melFeed').textContent), $('#melFeed').textContent);
});


/* ---------- Acordes ---------- */
teste('todo acorde (12 tônicas × 6 tipos) tem posição na mão esquerda em pelo menos uma direção', () => {
  const faltam=[];
  for(const t in CHORD_TYPES) for(let pc=0;pc<12;pc++)
    if(!chordVoicings('left','open',pc,t).length && !chordVoicings('left','close',pc,t).length) faltam.push(chordName(pc,t));
  igual(faltam, []);
});
teste('posições de acorde só usam notas do acorde e cabem na mão', () => {
  for(const t in CHORD_TYPES) for(let pc=0;pc<12;pc++) for(const d of ['open','close']) for(const v of chordVoicings('left',d,pc,t)){
    const need=CHORD_TYPES[t].iv.map(i=>(pc+i)%12);
    v.btns.forEach(b=>ok(need.includes(b[d]%12), chordName(pc,t)));
  }
});
teste('treino de acordes: acerto com a posição sugerida e erro com nota sobrando', () => {
  go('acordes'); $('#chHand').value='left'; $('#chTrain').click();
  const {vs}=ch.target; vs[0].btns.forEach(b=>chordPress(b));
  $('#chCheck').click(); igual($('#chFeed').textContent, 'Certo!');
  ch.round=0; nextChordRound();
  const {pc,type}=ch.target, L=state.layout.left;
  ch.target.vs[0].btns.forEach(b=>chordPress(b));
  const intruso=L.find(b=>!CHORD_TYPES[type].iv.map(i=>(pc+i)%12).includes(b[ch.dir]%12)); chordPress(intruso);
  $('#chCheck').click(); ok(/Sobrou/.test($('#chFeed').textContent), $('#chFeed').textContent);
  $('#chStop').click();
});

/* ---------- Duas mãos e partitura ---------- */
teste('duas mãos: notas simultâneas agrupadas e mesma direção de fole', () => {
  const m = parseMelody(BUILTIN_MELODIES.find(x=>x.id==='ode-duas').text); fingerMelody(m);
  igual(m.hand, 'both'); igual(m.notes.filter(n=>n.error).length, 0, 'notas com erro');
  const g0 = m.groups[0]; igual(g0.idxs.map(i=>m.notes[i].hand), ['right','left']);
  for(const g of m.groups) if(!g.rest){ const ds=new Set(g.idxs.map(i=>m.notes[i].dir)); igual(ds.size, 1, 'grupo com duas direções'); }
});
teste('duas mãos: fole não inverte com nota segurada', () => {
  const m = parseMelody(BUILTIN_MELODIES.find(x=>x.id==='ode-duas').text); fingerMelody(m);
  const ns = m.notes.filter(n=>!n.rest && !n.error);
  for(const g of m.groups){ if(g.rest||!g.dir) continue;
    const segurada = ns.find(n=>n.t < g.t-1e-6 && n.t+n.beats > g.t+1e-6);
    if(segurada) igual(g.dir, segurada.dir, 'inverteu com nota soando em '+g.t); }
});
teste('duas mãos: modo Espera exige as duas notas de cada momento', () => {
  go('melodias'); loadMelody('ode-duas'); $('#melMode').value='wait'; $('#melAuto').checked=true; $('#melStart').click();
  igual(pendingNotes().length, 2);
  const [a] = pendingNotes(); melPress(a.btn, a.midi, a.dir); igual(pendingNotes().length, 1, 'deve faltar uma');
  tocarEspera(); ok(/100%/.test($('#melFeed').textContent), $('#melFeed').textContent);
});
teste('partitura desenha uma cabeça de nota por nota tocável', () => {
  $('#melStaffOn').checked=true; loadMelody('ode-duas');
  igual($$('#melStaff .nh').length, mel.cur.notes.filter(n=>!n.rest).length);
});
teste('MusicXML: importação a duas mãos mantém a sincronia', () => {
  const sc = parseMusicXML(XML_TESTE);
  const r = melodyFromScore(sc, {part:0, staff:'hands', fitOctave:false});
  const m = parseMelody(r.text); igual(m.hand, 'both');
  const fim = h => Math.max(...m.notes.filter(n=>n.hand===h).map(n=>n.t+n.beats));
  igual(fim('right'), fim('left'));
});

/* ---------- Revisão inteligente e rotina ---------- */
teste('sorteio inteligente favorece os botões mais errados', () => {
  const salvo = JSON.stringify(state.progress.btnStats);
  state.progress.btnStats = {};
  const L = state.layout.right, alvo = L[5];
  L.forEach(b=>state.progress.btnStats[statKey('right',b.id,'open')] = {ok:10, err:0});
  state.progress.btnStats[statKey('right',alvo.id,'open')] = {ok:0, err:10};
  $('#fMode').value='smart'; fq.answer=null;
  let n=0; for(let i=0;i<2000;i++) if(pickFindTarget('right','open')===alvo) n++;
  state.progress.btnStats = JSON.parse(salvo);
  ok(n/2000 > 0.15, 'frequência '+(n/2000).toFixed(3)+' (sorteio puro seria 0,026)');
});
teste('mapa de erros pinta os botões e some ao desligar', () => {
  go('desafios'); const b=state.layout.right[0];
  state.progress.btnStats[statKey('right',b.id,'open')] = {ok:0, err:3};
  $('#fDir').value='open'; toggleHeat();
  ok(document.querySelector('#fkRight .key').style.background.includes('rgb'), 'sem cor');
  toggleHeat(); igual(document.querySelector('#fkRight .key').style.background, '');
  delete state.progress.btnStats[statKey('right',b.id,'open')];
});
teste('rotina: atividades marcam o dia e contam a sequência', () => {
  const salvo = JSON.stringify(state.progress.days);
  state.progress.days = {};
  const ontem = new Date(); ontem.setDate(ontem.getDate()-1);
  const anteontem = new Date(); anteontem.setDate(anteontem.getDate()-2);
  state.progress.days[dayKey(ontem)] = {ritmo:true}; state.progress.days[dayKey(anteontem)] = {fole:true};
  igual(streak(), 2, 'sequência antes de praticar hoje');
  logPractice('acordes'); igual(streak(), 3);
  ok(document.querySelectorAll('#routine .ritem.done').length===1, 'item de repertório marcado');
  state.progress.days = JSON.parse(salvo); renderRoutine();
});
teste('escala do dia sempre cabe na mão direita', () => {
  for(let k=0;k<24;k++){ const d=new Date(2026,0,1+k), {pc,type}=dailyScale(d); ok(validStarts(type,pc,'right',1).length, type+' '+pc); }
});

/* ---------- Lições ---------- */
teste('11 lições, todas com quiz de resposta válida', () => {
  igual(LESSONS.length, 11);
  LESSONS.forEach(l=>{ ok(l.quiz.length, l.title); l.quiz.forEach(q=>ok(q.a>=0 && q.a<q.o.length, l.title)); });
});
teste('links internos das lições apontam para abas existentes', () => {
  const abas = $$('main>section').map(s=>s.id.slice(2));
  LESSONS.forEach(l=>[...l.html.matchAll(/data-go="([^"]+)"/g)].forEach(m=>ok(abas.includes(m[1]), l.title+' → '+m[1])));
});


/* ---------- Idiomas ---------- */
const esperar = () => new Promise(r=>setTimeout(r,0)); // o tradutor roda logo depois de cada mudança
const PARECE_PT = /[ãõçêâôÃÕÇÊÂÔ]|\b(você|fole|Toque|Ouvir|Certo|Rodada|Acertos|Sobe|Desce|direita|esquerda|botão|botões|mão|mãos|Começar|Lições|Escolher|Parar|Abrindo|Fechando|abrindo|fechando)\b/;
function textosEmPortugues(){
  const achados = new Set(), w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for(let n=w.nextNode(); n; n=w.nextNode()){
    const p = n.parentNode;
    if(['SCRIPT','STYLE','TEXTAREA','CODE'].includes(p.nodeName) || p.closest('[translate="no"],#resultado-testes')) continue;
    // nomes próprios (cidades, prêmios, festivais) ficam em português em qualquer idioma
    const s = n.nodeValue.replace(/\s+/g,' ').trim().replace(/Caçapava do Sul|Simões Lopes Neto|Moenda da Canção|Tafona da Canção Nativa|Santo Antônio da Patrulha|Rádio|RepeTCHÊ/g,'');
    if(s && PARECE_PT.test(s)) achados.add(s);
  }
  return [...achados];
}
async function percorrerApp(){
  for(const v of ['inicio','estudo','teoria','teclado','desafios','melodias','acordes','eco','ritmo','ajustes','academia','microfone','perfil','professor']){ go(v); await esperar(); }
  // Eco: a faixa, o placar e a tela do fim passam pela tradução
  { const antes = state.progress.eco[eco.id]; go('eco'); ecoComecar(); await esperar(); ecoLimpar(); ecoRodada(); await esperar(); ecoLimpar();
    ecoOuvir(); await esperar(); ecoLimpar(); ecoSuaVez(); await esperar(); ecoRodadaFeita(); await esperar(); ecoLimpar(); ecoFim(); await esperar();
    if(antes) state.progress.eco[eco.id] = antes; else delete state.progress.eco[eco.id]; ecoParar(); }
  abrirControles(); await esperar(); ligarPc(true); await esperar(); ligarPc(false); $('#ctlDialog').close();
  abrirSugestao(); await esperar(); $('#sugDialog').close(); compartilhar(t('Relatório do BanDoly'), 'x'); await esperar(); $('#partilha').close();
  store.set('tarefa', {ex:'n3-escada', modo:'praticar', vel:70, prof:'', msg:''}); renderTarefa(); await esperar(); store.set('tarefa', null); renderTarefa();
  $('#prGerar').click(); await esperar();
  abrirBoasVindas(); await esperar(); $('#boasVindas').close(); trilhaAberta = true; renderTrilha(); await esperar(); trilhaAberta = false;
  mcMostrar(69, 4, 0.1); await esperar(); mcMostrar(70, -30, 0.1); await esperar();
  avisar('<b>Conquista nova: Bisonoro</b>'); await esperar();
  for(let i=0;i<LESSONS.length;i++){ curLesson=i; renderLesson(); await esperar(); }
  go('desafios'); $('#fStart').click(); await esperar(); $('#sStart').click(); await esperar();
  $('[data-ch="pautabot"]').click(); $('#pStart').click(); await esperar();
  { const b = state.layout[pq.hand].find(x=>x[pq.dir]!==pq.target); pautaPress(b, b[pq.dir], pq.hand==='left'?pkL:pkR); } await esperar(); pq.round = 10; nextPauta(); await esperar();
  go('teoria'); for(let i=0;i<TEORIA.length;i++){ teoriaAtual = i; renderTeoria(); await esperar(); $('#teConteudo [data-o="0"]').click(); await esperar(); }
  teoriaAtual = 1; renderTeoria(); $('#teConteudo [data-d]').dispatchEvent(new MouseEvent('click', {bubbles:true})); await esperar(); go('desafios');
  $('[data-ch="ear"]').click(); $('#eStart').click(); await esperar();
  { const b = state.layout[eq.hand].find(x=>x[eq.dir]!==eq.target); earPress(b, b[eq.dir], eq.hand==='left'?ekL:ekR); } await esperar();
  eq.round = 10; nextEar(); await esperar(); $('[data-ch="find"]').click();
  go('melodias'); $('#scaleOpen').click(); $('#scGo').click(); $('#melMode').value='wait'; $('#melStart').click(); await esperar();
  { const c=pendingNotes()[0]; melPress(c.btn,c.midi,c.dir); } await esperar(); stopMelody();
  loadMelody('ode-duas'); $('#melStart').click(); await esperar(); stopMelody();
  go('acordes'); showChord(); $('#chTrain').click(); await esperar(); $('#chStop').click(); await esperar();
  go('ritmo'); renderSteps();
  // Academia: os 6 níveis, os 3 modos, um erro, um relatório e o Desafio no tempo
  go('academia');
  for(const n of ACADEMIA){ $(`#acNiveis [data-nivel="${n.nivel}"]`).click(); await esperar(); }
  carregarExercicio('n3-legato'); $('#acModo [data-modo="praticar"]').click(); $('#acAuto').checked = true; $('#acStart').click();
  { const e = acad.eventos[[...acad.pend][0]], b = state.layout[e.mao].find(x=>x[e.fole]!==e.midi); acadToque(b, b[e.fole], e.fole, akOf(e.mao)); }
  await esperar(); acadCompletar(); await esperar();
  carregarExercicio('n4-alternar'); $('#acAuto').checked = false; $('#acModo [data-modo="aprender"]').click(); $('#acStart').click();
  { const e = acad.eventos[[...acad.pend][0]], o = e.fole==='open'?'close':'open'; acadToque(e.botao, e.botao[o], o, akOf(e.mao)); }
  await esperar(); acadParar();
  carregarExercicio('n5-sincronia'); $('#acModo [data-modo="desafio"]').click(); $('#acStart').click(); await esperar(); acadParar();
  go('inicio'); await esperar();
}
for(const lang of ['es','en']) teste(`tradução completa (${lang}): nenhum texto em português na tela`, async () => {
  setLang(lang); await esperar(); await percorrerApp();
  const pt = textosEmPortugues(); setLang('pt'); await esperar();
  igual(pt.slice(0,40), []);
});
teste('voltar ao português restaura os textos originais', async () => {
  setLang('es'); await esperar(); setLang('pt'); await esperar();
  igual($('#subnav [data-v="licoes"]').textContent, 'Lições'); igual(document.documentElement.lang, 'pt-BR');
});
teste('formato de texto aceita palavras-chave em espanhol e inglês', () => {
  const m = parseMelody('title: X\nhand: left\nbpm: 90\nderecha: Do4 Re4\nizquierda: Do3:2');
  igual(m.title, 'X'); igual(m.bpm, 90); igual(m.hand, 'both');
  igual(m.notes.filter(n=>n.hand==='left').length, 1);
});
teste('t() traduz modelos com valores', () => {
  const l = state.lang; state.lang='es'; igual(t('Rodada {}/10 · Acertos: {}', 3, 2), 'Ronda 3/10 · Aciertos: 2');
  state.lang='en'; igual(t('Esse é {}.', 'E4'), 'That is E4.'); state.lang=l;
});

// Academia: toca o momento atual com o botão e o fole pedidos
function acadTocarCerto(){ const e = acad.eventos[[...acad.pend][0]]; acadToque(e.botao, e.botao[e.fole], e.fole, akOf(e.mao)); }
function acadCompletar(){ let n = 0; while(acad.rodando && n++ < 500) acadTocarCerto(); }
teste('Academia: exercícios funcionais nos 6 níveis, todos dentro do mapa', () => {
  // nível 7 = partituras importadas pelo usuário (começa vazio; testado em "Minhas partituras")
  igual(ACADEMIA.map(n=>n.nivel), [1,2,3,4,5,6,7]);
  for(const n of ACADEMIA.filter(n=>n.nivel<=6)){
    const f = n.exercicios.filter(e=>!e.pendente);
    if(f.length < 3) throw new Error('nível ' + n.nivel + ' com poucos exercícios');
    for(const e of f){
      const evs = montarEventos(e);
      if(evs.length < 4) throw new Error(e.id + ' sem notas suficientes');
      for(const v of evs) if(v.botao[v.fole]!==v.midi || !state.layout[v.mao].includes(v.botao)) throw new Error(e.id + ': nota fora do mapa');
    }
  }
});
teste('Academia: Aprender completo gera relatório e não afirma o dedo', () => {
  go('academia'); carregarExercicio('n2-sequencias'); $('#acModo [data-modo="aprender"]').click(); $('#acAuto').checked = true;
  $('#acStart').click(); acadCompletar();
  const rel = $('#acRelatorio').textContent;
  igual(/100%/.test(rel), true, 'precisão'); igual(/Dedilhado verificado/.test(rel), false, 'dedo verificado');
  igual(/não indica nem confere o dedo/.test(rel), true, 'sem dedo de referência'); go('inicio');
});
teste('Academia: o erro mostra a diferença entre o pedido e o tocado', () => {
  go('academia'); carregarExercicio('n4-alternar'); $('#acModo [data-modo="aprender"]').click(); $('#acAuto').checked = false;
  $('#acStart').click(); acadSetDir(acad.grupos[0].fole);
  const e = acad.eventos[[...acad.pend][0]], outro = e.fole==='open' ? 'close' : 'open';
  acadToque(e.botao, e.botao[outro], outro, akOf(e.mao));
  igual(/botão certo, fole na direção errada/.test($('#acFeed').textContent), true); acadParar(); go('inicio');
});
teste('Academia: dedo sugerido aparece no botão; com validador ele passa a ser verificado', () => {
  go('academia'); carregarExercicio('n2-indicado');
  acad.todos.forEach((e,i)=>{ e.dedo = 2 + i%2; e.alternativas = [3]; }); aplicarTrecho();
  $('#acModo [data-modo="aprender"]').click(); $('#acAuto').checked = true; $('#acStart').click();
  igual(document.querySelector('#acKbRight .key[data-dedo]') != null, true, 'número no botão');
  registrarValidadorDeDedos({dedoUsado: e => e.dedo}); acadCompletar();
  igual(/Dedilhado verificado: \d+ de \d+ certos/.test($('#acRelatorio').textContent), true);
  registrarValidadorDeDedos(null); go('inicio');
});
teste('formato de texto: dedo recomendado e alternativos (@)', () => {
  const m = parseMelody('Mi4:8/a@3,2~ Mi4:8 Ré4');
  igual([m.notes[0].dedo, m.notes[0].alt, m.notes[0].beats, m.notes[0].force, m.notes[1].dedo], [3, [2], 1, 'open', null]);
});
teste('tela Início leva à página própria de Doly Costa', () => {
  igual($('.doly-link').getAttribute('href').startsWith('doly-costa/'), true); // index.html no fim quando aberto do computador
});

/* ---------- Academia · Minhas partituras ---------- */
// MIDI mínimo, montado aqui: 120 BPM, Dó4 (semínima), pausa (semínima), Mi4 (mínima)
const midiTeste = () => {
  const faixa = [0,0xff,0x51,3,0x07,0xa1,0x20, 0,0x90,60,100, 0x83,0x60,0x80,60,64, 0x83,0x60,0x90,64,100, 0x87,0x40,0x80,64,64, 0,0xff,0x2f,0];
  const n = faixa.length;
  return new Uint8Array([0x4d,0x54,0x68,0x64, 0,0,0,6, 0,0, 0,1, 0x01,0xe0,
                         0x4d,0x54,0x72,0x6b, 0,0,(n>>8)&255,n&255, ...faixa]).buffer;
};
const transcreverTeste = () => melodyFromScore(parseMidi(midiTeste()), {part:0, staff:'1', pick:'high', hand:'right', fitOctave:false});
teste('MIDI: notas, pausa e andamento', () => {
  const s = parseMidi(midiTeste());
  igual(s.tempo, 120);
  igual(s.parts[0].notes.map(n=>[n.start, n.dur, n.midi]), [[0,1,60], [2,2,64]]);
  ok(/p:4/.test(transcreverTeste().text), 'a pausa entre as notas deve aparecer no texto');
});
teste('Minhas partituras: a partitura importada vira exercício com botão, fole e pausa', () => {
  const antes = minhasPartituras().length, exAntes = acad.ex.id;
  igual(salvarPartitura('Teste', transcreverTeste().text, 'teste.mid'), {notas:2, fora:0});
  igual(acad.ex.nivel, 7); igual(acad.todos.length, 2);
  ok(acad.todos.every(e=>e.botao && e.fole), 'cada nota precisa de botão e fole');
  igual(acad.todos[1].inicio, 2, 'a segunda nota começa depois da pausa');
  abrirTranscricao(true);
  ok($('#acTranscricao tr.pausa'), 'a transcrição mostra a pausa');
  igual($$('#acTranscricao tr[data-i]').length, 2);
  abrirTranscricao(false);
  const conf = window.confirm; window.confirm = () => true;
  removerPartitura(acad.ex.id); window.confirm = conf;
  igual(minhasPartituras().length, antes);
  carregarExercicio(exAntes);
});

/* ---------- Execução ---------- */
(async () => {
  // os testes conferem textos em português: começa em pt mesmo se o navegador estiver em outro idioma
  setLang('pt'); await esperar();
  const linhas = [];
  for(const t of TESTES){
    try{ await t.fn(); linhas.push('OK     ' + t.nome); }
    catch(e){ linhas.push('FALHA  ' + t.nome + ' → ' + e.message); }
  }
  const falhas = linhas.filter(l=>l.startsWith('FALHA')).length;
  linhas.push('', `${TESTES.length - falhas}/${TESTES.length} testes passaram.`);
  const pre = document.createElement('pre'); pre.id = 'resultado-testes'; pre.textContent = linhas.join('\n');
  document.body.prepend(pre); document.title = 'TESTES-FIM';
})();

/* ---------- Etapa 3: áreas, caminho, conquistas, ouvido, notas caindo, microfone ---------- */
teste('navegação por áreas: cada área mostra só as suas abas e volta à última usada', () => {
  go('acordes');
  igual($('#nav [data-area].active').dataset.area, 'tocar');
  igual($$('#subnav [data-v]').filter(b=>!b.hidden).map(b=>b.dataset.v), ['teclado','melodias','acordes','microfone']);
  go('licoes'); $('#nav [data-area="tocar"]').click(); igual(currentView, 'acordes');
  igual($$('#subnav [data-area="aprender"]').map(b=>b.dataset.v), ['estudo','academia','licoes']);
  go('teoria'); ok($('#subnav [data-v="licoes"]').classList.contains('active'), 'Teoria acende o botão Lições'); go('licoes'); go('acordes');
  $('#nav [data-area="aprender"]').click(); igual(currentView, 'licoes');
  go('inicio'); ok($('#subnav').hidden, 'o Início não tem abas');
});
teste('caminho de estudo segue as respostas das perguntas iniciais', () => {
  const antes = store.get('perfilAluno', null);
  store.set('perfilAluno', {exp:'bandoneon', inst:'sim', obj:'conhecer'});
  let ids = etapasDoAluno().map(e=>e.id);
  ok(!ids.includes('conhecer') && !ids.includes('teclado') && !ids.includes('duas'), ids.join());
  ok(ids.includes('microfone')); igual(etapasDoAluno().pop().t, 'Quem inspirou o nome');
  store.set('perfilAluno', {exp:'nunca', inst:'nao', obj:'tango'});
  ids = etapasDoAluno().map(e=>e.id);
  ok(ids.includes('conhecer') && !ids.includes('microfone') && ids.includes('duas'));
  renderTrilha(); igual($$('#trilha .etapa').length, ids.length); ok($('#trilha .etapa.atual') || $$('#trilha .etapa.feita').length===ids.length);
  store.set('perfilAluno', antes);
});
teste('treino de ouvido: acerto conta ponto e o erro diz se é mais aguda ou mais grave', () => {
  go('desafios'); $('[data-ch="ear"]').click(); $('#eStart').click();
  const k = eq.hand==='left' ? ekL : ekR, errado = state.layout[eq.hand].find(b=>b[eq.dir]!==eq.target);
  earPress(errado, errado[eq.dir], k); ok(/mais (aguda|grave)/.test($('#eFeed').textContent), $('#eFeed').textContent);
  igual(eq.errors, 1);
  eq.errors = 0; earPress(eq.answer, eq.target, k); igual(eq.score, 1); igual(eq.round, 1);
  eq.active = false; $('[data-ch="find"]').click();
});
teste('conquistas: recorde novo ganha a insígnia e o cartão de compartilhar tem 1080 px', () => {
  const antes = state.progress.find, tinha = state.progress.insignias.memoria;
  delete state.progress.insignias.memoria; state.progress.find = 8; saveProgress();
  ok(state.progress.insignias.memoria, 'insígnia registrada');
  go('perfil'); ok($('#insignias .insignia.ganha [data-partilhar="memoria"]'), 'botão de compartilhar');
  igual(desenharCartao(INSIGNIAS.find(x=>x.id==='memoria')).width, 1080);
  state.progress.find = antes; if(tinha) state.progress.insignias.memoria = tinha; else delete state.progress.insignias.memoria;
  saveProgress(); go('inicio');
});
teste('lições: a tarefa "toque agora" avança com a nota certa e não com a errada', () => {
  curLesson = 0; renderLesson(); go('licoes');
  const k = tarefaKbs[1], certo = state.layout.right.find(b=>b.open===69), errado = state.layout.right.find(b=>b.open!==69);
  tarefaToque(errado, errado.open, k); igual(tarefa.passo, 0);
  tarefaToque(certo, 69, k); igual(tarefa.passo, 1); ok(state.progress.tarefas[0]);
  go('inicio');
});
teste('notas caindo desenham a melodia no quadro', () => {
  go('melodias'); loadMelody('ode'); $('#melRollOn').checked = true; $('#melRollOn').dispatchEvent(new Event('change'));
  rollQuadro(); ok($('#melRollCv').width > 0, 'o quadro tem tamanho');
  $('#melRollOn').checked = false; $('#melRollOn').dispatchEvent(new Event('change')); go('inicio');
});
teste('Bandoneon real: a nota ouvida acende os botões que dão essa nota', () => {
  go('microfone'); $('#mcDir').value = 'open'; mcUltima = null; mcMostrar(69, 3, 0.1);
  igual($('#mcNota').textContent, noteName(69));
  ok($$('#mcRight .key.chord').length >= 1, 'botão aceso na mão direita');
  ok($('#mcAfinador').classList.contains('afinado'));
  go('inicio');
});
teste('vibração e animações: Ajustes liga e desliga', () => {
  $('#movSel').value = 'reduzido'; $('#movSel').dispatchEvent(new Event('change')); ok(document.documentElement.classList.contains('sem-mov'));
  $('#movSel').value = 'normal'; $('#movSel').dispatchEvent(new Event('change'));
  igual(document.documentElement.classList.contains('sem-mov'), movReduzido());
});

teste('Academia: tocar o botão que brilha começa o exercício com a nota mostrada', () => {
  go('academia'); carregarExercicio('n1-direita'); $('#acModo [data-modo="aprender"]').click(); $('#acAuto').checked = true;
  ok(!acad.rodando, 'ainda parado');
  const e = acad.eventos[acad.grupos[0].ks[0]];
  ok(document.querySelector(`#acKbRight .key.guia`), 'o primeiro botão brilha antes de começar');
  acadToque(e.botao, e.botao[e.fole], e.fole, akOf(e.mao));
  ok(acad.rodando, 'começou'); igual(acad.g, 1, 'avançou para a segunda nota'); ok(acad.res[0].ok, 'a primeira nota contou');
  ok($('#acProgTxt').textContent.includes('2'), 'barra de progresso avançou');
  acadParar(); go('inicio');
});
teste('Academia: dicas de posição vêm do mapa e nunca citam um dedo', () => {
  go('academia'); carregarExercicio('n3-escada');
  for(let i=0;i<acad.grupos.length;i++){
    const ds = dicasPosicao(i); ok(ds.length>0, 'momento '+i+' sem dica');
    ok(ds.every(d=>!/dedo/i.test(d.txt)), ds.map(d=>d.txt).join(' | '));
  }
  go('inicio');
});

/* ---------- Controles: teclado do computador, MIDI, pressão; professores; sugestão ---------- */
teste('teclado do computador: o mapa padrão cobre as duas mãos e a tecla toca o botão', () => {
  const mapa = mapaPcPadrao(), botoes = Object.values(mapa);
  ok(botoes.filter(b=>b.mao==='left').length >= 18 && botoes.filter(b=>b.mao==='right').length >= 24, 'teclas mapeadas');
  igual(new Set(botoes.map(b=>b.mao+b.id)).size, botoes.length, 'uma tecla por botão');
  go('teclado'); const antes = pc.ligado, mapaAntes = pc.mapa; pc.mapa = mapa; ligarPc(true);
  const cod = Object.keys(mapa).find(c=>mapa[c].mao==='right'), alvo = mapa[cod];
  document.dispatchEvent(new KeyboardEvent('keydown', {code:cod, bubbles:true}));
  ok(tkR.held.has(alvo.id), 'botão apertado'); ok(document.querySelector(`#kbRight .key[data-tecla]`), 'letra da tecla no botão');
  document.dispatchEvent(new KeyboardEvent('keyup', {code:cod, bubbles:true}));
  ok(!tkR.held.has(alvo.id), 'botão solto');
  pc.mapa = mapaAntes; ligarPc(antes); go('inicio');
});
teste('teclado do computador: editar o mapa troca a tecla de um botão', () => {
  go('teclado'); const mapaAntes = JSON.stringify(pc.mapa), antes = pc.ligado;
  comecarAtribuir(); const b = state.layout.left[0];
  tkL.tocar(b.id); ok(!tkL.held.has(b.id), 'no modo editar, o toque não toca');
  document.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyJ', bubbles:true}));
  igual(pc.mapa.KeyJ, {mao:'left', id:b.id});
  pararAtribuir(); pc.mapa = JSON.parse(mapaAntes); salvarMapaPc(); ligarPc(antes); go('inicio');
});
teste('MIDI: a nota acha o botão na direção atual e a pressão muda o volume', () => {
  go('teclado'); setDir('open'); const b = state.layout.right.find(x=>x.open===69);
  midiNota(69, 1); ok(tkR.held.has(b.id) || state.layout.right.some(x=>x.open===69 && tkR.held.has(x.id)), 'botão do Lá abrindo');
  midiSolta(69); igual(tkR.held.size, 0);
  const p0 = pressaoFole; midiCtl.cc.pressao = 11; midiControle(11, 0.25); igual(Math.round(pressaoFole*100), 25);
  midiCtl.cc.fole = 64; midiControle(64, 1); igual(state.dir, 'close'); midiControle(64, 0); igual(state.dir, 'open');
  setPressao(p0); go('inicio');
});
teste('professor: o link da tarefa abre o exercício com modo, velocidade, mensagem e digitação', () => {
  go('professor'); $('#prEx').value = 'n3-escada'; $('#prModo').value = 'desafio'; $('#prVel').value = '60';
  $('#prNome').value = 'Prof. Teste'; $('#prMsg').value = 'Três vezes'; salvarDedo('n3-escada', 'n3-escada#1', 3); $('#prDedos').checked = true;
  const url = linkTarefa(); ok(url.includes('#tarefa='));
  salvarDedo('n3-escada', 'n3-escada#1', null);
  abrirTarefa(url.split('#tarefa=')[1]);
  igual(currentView, 'academia'); igual(acad.ex.id, 'n3-escada'); igual(acad.modo, 'desafio'); igual($('#acVel').value, '60');
  ok(/Prof\. Teste/.test($('#v-academia .tarefa-aviso').textContent), 'aviso com o nome do professor');
  igual(acad.todos[0].dedo, 3); igual(acad.todos[0].fonte, 'professor');
  store.set('tarefa', null); renderTarefa(); salvarDedo('n3-escada', 'n3-escada#1', null); carregarExercicio('n3-escada'); go('inicio');
});
teste('professor: o relatório ganha o botão de enviar ao professor', async () => {
  go('academia'); carregarExercicio('n2-sequencias'); $('#acModo [data-modo="aprender"]').click(); $('#acAuto').checked = true;
  $('#acStart').click(); acadCompletar(); await new Promise(r=>setTimeout(r,10));
  ok($('#acEnviarRel'), 'botão no relatório'); $('#acEnviarRel').click();
  ok(/Relatório da Academia/.test($('#partilhaTexto').value) || /Academy report/.test($('#partilhaTexto').value), 'texto do relatório');
  $('#partilha').close(); go('inicio');
});
teste('sugestão: o texto leva o tipo, a mensagem e as informações técnicas', () => {
  abrirSugestao(); $('#sugTexto').value = 'O botão travou'; $$('#sugForm [name="tipo"]').find(r=>r.value==='erro').checked = true;
  const {titulo, corpo} = textoSugestao(); ok(/\[Erro\] O botão travou/.test(titulo) || /O botão travou/.test(titulo), titulo);
  ok(corpo.includes(navigator.userAgent)); $('#sugDialog').close();
});

/* ---------- Teoria musical, Pauta no bandoneon e a Academia reorganizada ---------- */
teste('teoria: 7 tópicos, a pauta toca a nota clicada e o teste rápido marca o tópico', () => {
  go('teoria'); igual(TEORIA.length, 7); igual($$('#teLista [data-t]').length, 7);
  teoriaAtual = 1; renderTeoria();
  $('#teConteudo [data-d="32"]').dispatchEvent(new MouseEvent('click', {bubbles:true}));
  ok($('#teConteudo .te-nome').textContent.includes(noteName(dToMidi(32))), 'nome da nota da 2ª linha');
  const antes = state.progress.teoria.pauta; delete state.progress.teoria.pauta;
  const q = $('#teConteudo .te-q'); q.querySelector(`[data-o="${q.dataset.a}"]`).click();
  ok(state.progress.teoria.pauta, 'tópico concluído');
  if(!antes) delete state.progress.teoria.pauta; saveProgress(); go('inicio');
});
teste('pauta no bandoneon: a nota da pauta é a do botão pedido e o acerto conta ponto', () => {
  go('desafios'); $('[data-ch="pautabot"]').click(); $('#pHand').value = 'right'; $('#pStart').click();
  const n = $('#pPauta .nota'); ok(n, 'nota desenhada'); ok(pq.target>=55 && pq.target<=84, 'na faixa da clave de sol');
  pautaPress(pq.answer, pq.target, pkR); igual(pq.score, 1);
  pq.active = false; $('[data-ch="find"]').click(); go('inicio');
});
teste('Academia: exercício de uma mão mostra só aquela mão; o de duas mostra as duas com o fole', () => {
  go('academia'); carregarExercicio('n3-escada');
  igual($('#acTeclados').dataset.maos, 'right'); ok($('#acMaoE').hidden && !$('#acMaoD').hidden);
  carregarExercicio('n5-sincronia'); igual($('#acTeclados').dataset.maos, 'duas'); ok(!$('#acMaoE').hidden && !$('#acMaoD').hidden);
  $('#acModo [data-modo="aprender"]').click(); $('#acStart').click();
  ok($('#acEscolha').classList.contains('recolhido'), 'a escolha recolhe ao começar');
  igual($('#acResumoTit').textContent, acad.ex.titulo);
  $('#acTrocar').click(); ok(!$('#acEscolha').classList.contains('recolhido')); ok(!acad.rodando);
  go('inicio');
});
teste('fole: avisa perto do fim, o botão da mensagem troca a direção e o modo sem limite é opcional', () => {
  const antes = {level:bel.level, livre:bel.livre, dir:state.dir};
  go('teclado'); setFoleLivre(false); setDir('open'); bel.level = 0.9; atualizarAvisoFole();
  ok($('#bellows').classList.contains('quase'), 'fole laranja perto do fim');
  ok($('#bellowsWarn [data-troca-fole]'), 'mensagem com o botão Trocar direção');
  bel.level = 1; bel.blocked = true; atualizarAvisoFole();
  ok($('#bellows').classList.contains('fim'), 'no fim fica vermelho');
  $('#bellowsWarn [data-troca-fole]').click(); igual(state.dir, 'close');
  ok(!bel.blocked, 'trocar a direção libera o som');
  ok(!store.get('foleLivre', false), 'sem limite vem desligado');
  $('#foleLivreBtn').click(); ok(bel.livre && store.get('foleLivre', false), 'ligou e salvou');
  setDir('open'); bel.level = 0.9; atualizarAvisoFole();
  ok(!$('#bellows').classList.contains('quase'), 'no modo livre não há aviso');
  setFoleLivre(antes.livre); setDir(antes.dir); bel.level = antes.level; go('inicio');
});
teste('nomes das notas: ligados por padrão em todas as telas e uma caixa desliga em todas', () => {
  const antes = state.showLabels, nomeEm = sel => $$(sel+' .key').some(k=>k.textContent.trim()!=='');
  setMostrarNomes(true); go('desafios'); construirPendentes(); fq.active = false; refreshAll();
  ok(nomeEm('#fkRight'), 'Encontre a nota mostra os nomes antes de começar');
  fq.active = true; refreshAll(); ok(!nomeEm('#fkRight'), 'durante a rodada os nomes somem');
  fq.active = false; refreshAll(); ok(nomeEm('#fkRight'), 'e voltam no fim');
  const caixa = $('#chEar .nomesToggle'); caixa.checked = false; caixa.dispatchEvent(new Event('change'));
  ok(!state.showLabels && store.get('mostrarNomes', true)===false, 'preferência salva');
  ok(!nomeEm('#fkRight'), 'some do teclado');
  ok($$('.nomesToggle').every(c=>!c.checked), 'todas as caixas acompanham');
  go('academia'); carregarExercicio('n1-sem-ajuda'); setMostrarNomes(true);
  ok(!acadMostraNomes(), '"Sem auxílio visual" continua sem nomes');
  setMostrarNomes(antes); go('inicio');
});
teste('teclado em tela cheia: botões maiores, mãos e fole na barra, e tudo volta ao sair', () => {
  go('teclado'); construirPendentes();
  const antes = tkR.size, verPai = $('#tkVer').parentNode;
  $('[data-tk-cheia]').click();
  ok(tkCard.classList.contains('cheia') && !tkBarra.hidden, 'entrou');
  ok(tkBarra.contains($('#tkVer')) && tkBarra.contains($('#dirPill')), 'mãos e fole na barra');
  const cabeNaTela = id => { const r = $(id).getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1; };
  ok(cabeNaTela('#kbLeft') && cabeNaTela('#kbRight'), `as duas mãos inteiras na tela (${antes} → ${tkR.size}px)`);
  const duas = tkR.size; $('#tkVer [data-ver="right"]').click();
  ok(tkR.size >= duas && cabeNaTela('#kbRight'), `uma mão só fica maior (${tkR.size}px)`);
  $('#tkVer [data-ver="duas"]').click();
  const d = state.dir; $('#dirPill').click(); ok(state.dir !== d, 'tocar na pílula troca a direção'); setDir(d);
  go('inicio');
  ok(!tkCard.classList.contains('cheia') && $('#tkVer').parentNode === verPai, 'sair da aba sai da tela cheia e devolve tudo');
  ok(tkOpts.size === undefined, 'tamanho automático de novo');
});
teste('dicas de tecla: aparecem só com teclado', () => {
  const tem = document.documentElement.classList.contains('tem-teclado');
  document.documentElement.classList.remove('tem-teclado');
  go('teclado');
  ok(getComputedStyle($('#dirBtn .so-teclado')).display === 'none', 'sem teclado, sem "(Espaço)"');
  igual(comTeclado(), false);
  document.documentElement.classList.toggle('tem-teclado', tem); go('inicio');
});
teste('Eco: a música cresce de 2 em 2, o acerto pontua, o erro mostra o botão e o fim dá estrelas', () => {
  const antes = state.progress.eco.estrelinha;
  go('eco'); eco.id = 'estrelinha'; $('#ecoPasso').value = '2'; $('#ecoAjuda').value = 'ver';
  ecoComecar(); ecoLimpar();
  ok(!$('#ecoJogo').hidden && $('#ecoEscolha').hidden, 'a escolha dá lugar ao jogo');
  igual(eco.seq.length, 42); igual(eco.fimT, 8); igual(eco.rodadas, 21);
  igual($$('#ecoTrilha i').length, 42);
  ecoRodada(); ecoLimpar(); igual(eco.alvo, 2);
  ecoSuaVez(); const k = ecoKb(), n0 = eco.seq[0], n1 = eco.seq[1];
  ecoPress(n0.btn, n0.midi, k); igual(eco.pos, 1); igual(eco.pontos, 10);
  const errado = state.layout[eco.hand].find(b=>b[eco.dir]!==n1.midi);
  ecoPress(errado, errado[eco.dir], k);
  igual(eco.pos, 1); igual(eco.erros, 1); igual(eco.combo, 0);
  ok($('#ecoFeed').classList.contains('bad'), 'o erro avisa');
  ecoPress(n1.btn, n1.midi, k); ecoLimpar();
  igual(eco.fase, 'entre'); igual(eco.pontos, 20);
  ecoRodada(); ecoLimpar(); igual(eco.alvo, 4); igual(eco.pos, 0);
  ecoSuaVez(); eco.seq.slice(0,4).forEach(n=>ecoPress(n.btn, n.midi, k)); ecoLimpar();
  ok(eco.pontos > 20 + 40, 'rodada perfeita ganha bônus');
  eco.erros = 0; ecoFim();
  ok(!$('#ecoFimCard').hidden, 'tela do fim'); igual(state.progress.eco.estrelinha.estrelas, 3);
  igual($$('#ecoFimEstrelas svg.on').length, 3);
  if(antes) state.progress.eco.estrelinha = antes; else delete state.progress.eco.estrelinha;
  saveProgress(); ecoParar(); go('inicio');
});
teste('Eco: todas as músicas têm notas com botão e fole', () => {
  for(const x of ECO_MUSICAS){ const {seq} = ecoMusica(x.id); ok(seq.length>=8 && seq.every(n=>n.btn && n.dir), x.id); }
});
