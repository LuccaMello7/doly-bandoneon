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
  go('teclado'); bel.level = 0.5; setDir('open');
  tecla('keydown','KeyF'); passarTempoFole(400); tecla('keyup','KeyF');
  ok(bel.level < 0.5, 'F deveria fechar'); igual(state.dir, 'open');
  const l = bel.level; tecla('keydown','KeyA'); passarTempoFole(400); tecla('keyup','KeyA');
  ok(bel.level > l, 'A deveria abrir'); igual(bel.valve, null);
});
teste('fole no limite bloqueia e a válvula libera', () => {
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
teste('som: toda nota do mapa tem amostra (transposição até 7 semitons)', () => {
  if(!SF) return;
  for(const h of ['left','right']) for(const b of state.layout[h]) for(const d of ['open','close']){
    const z = sfZone(b[d]); ok(Math.abs(b[d]-z.root) <= 7, 'nota ' + b[d]);
  }
});


/* ---------- Ajustes ---------- */
teste('afinação muda a velocidade das amostras e a frequência do sintetizado', () => {
  if(!SF) return;
  const antes = state.tuning;
  state.tuning = 443; const r443 = makeSampleVoice(69, 0, AC.currentTime).oscs[0].playbackRate.value;
  state.tuning = 440; const r440 = makeSampleVoice(69, 0, AC.currentTime).oscs[0].playbackRate.value;
  ok(Math.abs(r440/r443 - 440/443) < 1e-6); igual(Math.round(freq(69)), 440);
  state.tuning = antes;
});
teste('aba Ajustes existe e o cabeçalho não tem mais seletores', () => {
  go('ajustes'); ok($('#v-ajustes').classList.contains('active')); ok(!document.querySelector('header select'));
  ok($('#nav [data-v="ajustes"]').hasAttribute('aria-current'));
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
teste('detecção de altura no som gravado do bandoneon (todas as amostras)', () => {
  if(!SF) return; const a=state.tuning; state.tuning=443;
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
    const s = n.nodeValue.replace(/\s+/g,' ').trim();
    if(s && PARECE_PT.test(s)) achados.add(s);
  }
  return [...achados];
}
async function percorrerApp(){
  for(const v of ['inicio','teclado','desafios','melodias','acordes','ritmo','ajustes']){ go(v); await esperar(); }
  for(let i=0;i<LESSONS.length;i++){ curLesson=i; renderLesson(); await esperar(); }
  go('desafios'); $('#fStart').click(); await esperar(); $('#sStart').click(); await esperar();
  go('melodias'); $('#scaleOpen').click(); $('#scGo').click(); $('#melMode').value='wait'; $('#melStart').click(); await esperar();
  { const c=pendingNotes()[0]; melPress(c.btn,c.midi,c.dir); } await esperar(); stopMelody();
  loadMelody('ode-duas'); $('#melStart').click(); await esperar(); stopMelody();
  go('acordes'); showChord(); $('#chTrain').click(); await esperar(); $('#chStop').click(); await esperar();
  go('ritmo'); renderSteps(); go('inicio'); await esperar();
}
for(const lang of ['es','en']) teste(`tradução completa (${lang}): nenhum texto em português na tela`, async () => {
  setLang(lang); await esperar(); await percorrerApp();
  const pt = textosEmPortugues(); setLang('pt'); await esperar();
  igual(pt.slice(0,40), []);
});
teste('voltar ao português restaura os textos originais', async () => {
  setLang('es'); await esperar(); setLang('pt'); await esperar();
  igual($('#nav [data-v="licoes"]').textContent, 'Lições'); igual(document.documentElement.lang, 'pt-BR');
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
